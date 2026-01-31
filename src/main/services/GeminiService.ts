import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import fs from "fs";
import { DatabaseManager } from "../database/index.js";
import { AudioService } from "./AudioService.js";
import type {
  Podcast,
  Episode,
  Document,
  AudioProvisionResult,
} from "../../shared/types.js";
import type { GenerativeModel } from "@google/generative-ai";

/**
 * GeminiService - Flow C: AI Summary Pipeline
 *
 * Responsibilities:
 * - Upload audio to Gemini Files API
 * - Poll until file is ACTIVE
 * - Generate AI summary with custom/default prompt
 * - Persist markdown to documents table
 * - **CRITICAL**: Cleanup remote file and temp local file in finally block
 *
 * Cleanup Strategy:
 * - ALWAYS delete Gemini remote file (saves quota)
 * - ALWAYS delete temp local file if ephemeral (frees disk space)
 * - Use try...finally to ensure cleanup even on error
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private model: GenerativeModel;
  private isGenerating: boolean = false;
  private generatingEpisodeId: string | null = null;

  constructor(
    private db: DatabaseManager,
    private audioService: AudioService,
    apiKey: string,
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Update API key at runtime (called when user saves a new key)
   */
  updateApiKey(apiKey: string): void {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Check if a summary generation is in progress for a specific episode
   */
  isGeneratingEpisode(episodeId: string): boolean {
    return this.isGenerating && this.generatingEpisodeId === episodeId;
  }

  /**
   * Get current generating status
   */
  getGeneratingStatus(): { isGenerating: boolean; episodeId: string | null } {
    return {
      isGenerating: this.isGenerating,
      episodeId: this.generatingEpisodeId,
    };
  }

  /**
   * Mark generation as started
   */
  private startGeneration(episodeId: string): boolean {
    if (this.isGenerating) {
      return false;
    }
    this.isGenerating = true;
    this.generatingEpisodeId = episodeId;
    return true;
  }

  /**
   * Mark generation as completed (success or failure)
   */
  completeGeneration(): void {
    this.isGenerating = false;
    this.generatingEpisodeId = null;
  }

  /**
   * Generate AI summary for an episode
   *
   * Flow:
   * 1. Provision audio (Flow B)
   * 2. Upload to Gemini Files API
   * 3. Poll until state is ACTIVE
   * 4. Generate content with prompt
   * 5. Persist to DB
   * 6. **CRITICAL**: Cleanup in finally block
   *
   * @param episodeId - Episode ID
   * @returns Markdown summary
   */
  async generateSummary(episodeId: string): Promise<string> {
    let geminiFileUri: string | null = null;
    let geminiFileName: string | null = null;
    let localAudio: AudioProvisionResult | null = null;

    // Mark generation as started
    const started = this.startGeneration(episodeId);
    if (!started) {
      throw new Error("ALREADY_GENERATING");
    }

    try {
      // Step 1: Provision audio (Flow B)
      localAudio = await this.audioService.provisionAudio(episodeId);

      // Validate file size (Gemini limit is 2GB)
      const stats = fs.statSync(localAudio.path);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 2000) {
        throw new Error(
          `File too large: ${fileSizeMB.toFixed(2)}MB (max 2000MB)`,
        );
      }

      // Step 2: Upload to Gemini Files API
      console.log(`Uploading audio file (${fileSizeMB.toFixed(2)}MB)...`);
      const uploadResult = await this.fileManager.uploadFile(localAudio.path, {
        mimeType: "audio/mpeg",
        displayName: `episode-${episodeId}`,
      });

      geminiFileUri = uploadResult.file.uri;
      geminiFileName = uploadResult.file.name;

      if (!geminiFileName) {
        throw new Error("Upload failed: no file name returned");
      }

      console.log(`Uploaded: ${geminiFileName}`);

      // Step 3: Poll until file is ACTIVE (max 60 seconds)
      await this.pollUntilActive(geminiFileName, 60000);

      // Step 4: Get prompt (custom or default)
      const prompt = this.getPrompt(episodeId);

      // Step 5: Generate content
      console.log("Generating summary...");
      const result = await this.model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: geminiFileUri,
            mimeType: "audio/mpeg",
          },
        },
      ]);

      const markdown = result.response.text();

      // Step 6: Persist to DB (delete old summary first, then insert new)
      this.db.transaction(() => {
        this.db.deleteDocumentsByEpisode.run(episodeId);
        this.db.insertDocument.run(
          this.db.generateId(),
          episodeId,
          markdown,
          this.db.now(),
          prompt,
        );
      });

      console.log("Summary generated and saved to database");

      return markdown;
    } finally {
      // ===== CRITICAL: CLEANUP SECTION =====
      // This MUST execute regardless of success or failure

      // Reset generating status
      this.completeGeneration();

      // Cleanup 1: Delete remote Gemini file (saves quota)
      if (geminiFileName) {
        try {
          console.log(`Deleting remote file: ${geminiFileName}`);
          await this.fileManager.deleteFile(geminiFileName);
          console.log("Remote file deleted");
        } catch (err) {
          console.error("Failed to delete Gemini file:", err);
          // Don't throw - cleanup should be best-effort
        }
      }

      // Cleanup 2: Delete local temp file if ephemeral (frees disk space)
      if (localAudio?.isEphemeral && fs.existsSync(localAudio.path)) {
        try {
          console.log(`Deleting temp file: ${localAudio.path}`);
          fs.unlinkSync(localAudio.path);
          console.log("Temp file deleted");
        } catch (err) {
          console.error("Failed to delete temp file:", err);
          // Don't throw - cleanup should be best-effort
        }
      }
    }
  }

  /**
   * Poll Gemini file until state is ACTIVE
   *
   * @param fileName - Gemini file name
   * @param maxWaitMs - Max wait time in milliseconds
   */
  private async pollUntilActive(
    fileName: string,
    maxWaitMs: number,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    let elapsed = Date.now() - startTime;
    while (elapsed < maxWaitMs) {
      const file = await this.fileManager.getFile(fileName);

      console.log(`File state: ${file.state}`);

      if (file.state === FileState.ACTIVE) {
        return;
      }

      if (file.state === FileState.FAILED) {
        throw new Error("Gemini file processing failed");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      elapsed = Date.now() - startTime;
    }

    throw new Error(
      `Timeout waiting for file to become ACTIVE (${maxWaitMs}ms)`,
    );
  }

  /**
   * Get prompt for AI summary generation
   *
   * Priority:
   * 1. Podcast custom prompt
   * 2. Default prompt
   *
   * @param episodeId - Episode ID
   * @returns Prompt string
   */
  private getPrompt(episodeId: string): string {
    const episode = this.db.getEpisodeById.get(episodeId) as
      | Episode
      | undefined;

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    const podcast = this.db.getPodcastById.get(episode.podcast_id) as
      | Podcast
      | undefined;

    // Use custom prompt if available
    if (podcast?.custom_prompt) {
      return podcast.custom_prompt;
    }

    // Default prompt (Traditional Chinese, ~500 characters)
    return `你是一個專業的 Podcast 摘要助手。請完整分析音頻內容，並依據以下結構生成摘要：

## 節目資訊
- 節目名稱
- 主持人與嘉賓（如有）
- 本集主題或標題

## 重點議題
詳細列出本期討論的主要主題與子主題。對於每個主題，說明：
- 該主題的背景與脈絡
- 主持人或嘉賓的核心觀點
- 不同觀點之間的比較與碰撞
- 討論的深入程度與範圍

## 核心洞見
歸納本期最具價值的洞見與啟發：
- 解決了什麼問題或回答了什麼疑問
- 提供了什麼新知識或新視角
- 對聽眾可能產生的影響與啟發
- 與當前趨勢或時事的關聯性

## 行動建議
列出所有可執行的建議與下一步行動：
- 具體的行動步驟
- 可以嘗試的方法或工具
- 推薦的相關資源、書籍或網站
- 值得追蹤的議題或人物

## 關鍵字詞與概念
3-5 個核心關鍵字詞，解釋每個詞在本集脈絡中的含義，幫助快速理解本期內容的核心概念。

## 整體評價
簡短評價本期內容的：
- 內容品質與深度
- 對目標受眾的價值
- 有哪些值得一听的精彩時刻

確保涵蓋本期內容的精髓，讓未收聽的讀者也能獲得 格式輸出，保持完整理解。使用 Markdown簡潔清晰的風格。`;
  }

  /**
   * Get all documents (summaries) for an episode
   *
   * @param episodeId - Episode ID
   * @returns Array of documents
   */
  getDocuments(episodeId: string): Document[] {
    return this.db.getDocumentsByEpisode.all(episodeId) as Document[];
  }

  getDocumentsByPodcast(
    podcastId: string,
  ): (Document & { episode_title: string; episode_pub_date: string })[] {
    return this.db.getDocumentsByPodcast.all(podcastId) as (Document & {
      episode_title: string;
      episode_pub_date: string;
    })[];
  }

  /**
   * Check if episode has any summaries
   *
   * @param episodeId - Episode ID
   * @returns True if has summaries
   */
  hasSummaries(episodeId: string): boolean {
    const result = this.db.hasDocuments.get(episodeId) as
      | { count: number }
      | undefined;
    return (result?.count || 0) > 0;
  }

  /**
   * Delete a specific summary
   *
   * @param documentId - Document ID
   */
  deleteSummary(documentId: string) {
    this.db.deleteDocument.run(documentId);
  }
}

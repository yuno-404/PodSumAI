import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";
import axios from "axios";
import { shell } from "electron";
import { DatabaseManager } from "../database/index.js";
import type {
  RSSFeed,
  Podcast,
  Episode,
  PodcastSearchResult,
} from "../../shared/types.js";

/**
 * PodcastService - Flow A: Feed Ingestion & Synchronization
 *
 * Responsibilities:
 * - Fetch RSS XML via Worker Thread (non-blocking)
 * - Upsert podcast and episodes to database
 * - CRITICAL: Preserve is_downloaded and local_file_path on sync
 * - Maintain data consistency with transactions
 */
export class PodcastService {
  constructor(private db: DatabaseManager) {}

  /**
   * Subscribe to a new podcast or sync an existing one
   *
   * @param url - RSS feed URL
   * @param artworkUrl - Optional artwork URL from iTunes search
   * @returns Podcast ID and count of episodes fetched
   */
  async syncPodcast(
    url: string,
    artworkUrl?: string | null,
  ): Promise<{ podcastId: string; newCount: number }> {
    // Step 1: Parse RSS feed in worker thread (non-blocking)
    const feed = await this.parseRSSInWorker(url);

    // Step 2: Upsert to database in a transaction (atomic)
    const result = this.db.transaction(() => {
      // Check if podcast already exists
      const existing = this.db.getPodcastByFeedUrl.get(url) as any;
      const podcastId = existing?.id || this.db.generateId();

      // Priority: passed artwork > existing artwork > RSS artwork
      const finalArtworkUrl =
        artworkUrl || existing?.artwork_url || feed.podcast.artwork_url || null;

      // Upsert podcast
      this.db.upsertPodcast.run(
        podcastId,
        feed.podcast.title,
        url,
        finalArtworkUrl,
        this.db.now(),
        existing?.custom_prompt || null,
      );

      // Upsert episodes (preserves is_downloaded and local_file_path)
      feed.episodes.forEach((ep) => {
        this.db.upsertEpisode.run(
          ep.guid,
          podcastId,
          ep.title,
          ep.pub_date,
          ep.duration,
          ep.audio_url,
        );
      });

      return {
        podcastId,
        newCount: feed.episodes.length,
      };
    });

    return result;
  }

  /**
   * Parse RSS feed using Worker Thread to avoid blocking main thread
   *
   * @param url - RSS feed URL
   * @returns Parsed RSS feed data
   * @throws Error if parsing fails or times out
   */
  private parseRSSInWorker(url: string): Promise<RSSFeed> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(
        __dirname,
        "../workers/rss-parser.worker.js",
      );
      const worker = new Worker(workerPath);

      worker.postMessage({ url });

      worker.on("message", (result: RSSFeed | { error: string }) => {
        if ("error" in result) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
        worker.terminate();
      });

      worker.on("error", (error) => {
        reject(error);
        worker.terminate();
      });

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error("RSS parsing timeout (> 30 seconds)"));
      }, 30000);

      worker.on("exit", () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Get all podcasts
   */
  getAllPodcasts(): Podcast[] {
    return this.db.getPodcasts.all() as Podcast[];
  }

  /**
   * Get podcast by ID
   */
  getPodcastById(podcastId: string): Podcast | undefined {
    return this.db.getPodcastById.get(podcastId) as Podcast | undefined;
  }

  /**
   * Get all episodes for a podcast
   */
  getEpisodes(podcastId: string): Episode[] {
    return this.db.getEpisodesByPodcast.all(podcastId) as Episode[];
  }

  /**
   * Get single episode by ID
   */
  getEpisodeById(episodeId: string): Episode | undefined {
    return this.db.getEpisodeById.get(episodeId) as Episode | undefined;
  }

  /**
   * Update podcast's custom prompt
   * @param podcastId - Podcast ID
   * @param prompt - Custom prompt (null to reset to default)
   */
  updateCustomPrompt(podcastId: string, prompt: string | null) {
    this.db.updatePodcastPrompt.run(prompt, podcastId);
  }

  /**
   * Delete podcast and all associated episodes
   * CRITICAL: Preserve documents (summaries) and cleanup downloaded audio files
   */
  async deletePodcast(podcastId: string) {
    const episodes = this.db.getEpisodesByPodcast.all(podcastId) as Episode[];

    // Collect downloaded audio file paths for cleanup
    const downloadedFilePaths = episodes
      .filter((ep) => ep.is_downloaded && ep.local_file_path)
      .map((ep) => ep.local_file_path);

    // // Collect documents to preserve (remove episode_id, keep content)
    // const documentsToPreserve = episodes.flatMap((ep) =>
    //   (this.db.getDocumentsByEpisode.all(ep.id) as any[]).map((doc) => ({
    //     content: doc.content,
    //     created_at: doc.created_at,
    //     used_prompt: doc.used_prompt,
    //   })),
    // );

    // Delete podcast (cascade deletes episodes and their documents)
    this.db.deletePodcast.run(podcastId);

    // Move downloaded audio files to trash (not permanent delete)
    for (const filePath of downloadedFilePaths) {
      if (filePath && fs.existsSync(filePath)) {
        try {
          await shell.trashItem(filePath);
        } catch (error) {
          console.error(`Failed to trash audio file: ${filePath}`, error);
        }
      }
    }



    // Re-insert preserved documents without episode_id (for Knowledge page)
    // documentsToPreserve.forEach((doc) => {
    //   this.db.insertDocument.run(
    //     this.db.generateId(),
    //     null,
    //     doc.content,
    //     doc.created_at,
    //     doc.used_prompt,
    //   );
    // });
  }

  /**
   * Search podcasts by name using iTunes Search API
   * @param query - Search term (podcast name)
   * @returns Array of podcast search results with RSS feed URLs
   */
  async searchPodcasts(query: string): Promise<PodcastSearchResult[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=20`;

    try {
      const { data } = await axios.get(url, { timeout: 10000 });

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response from iTunes API");
      }

      return data.results.map((item: any) => ({
        id: item.collectionId.toString(),
        title: item.collectionName,
        author: item.artistName,
        feedUrl: item.feedUrl,
        artworkUrl: item.artworkUrl600 || item.artworkUrl100,
        description: item.collectionCensoredName,
      }));
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        throw new Error("Search timeout - please try again");
      }
      if (error.response) {
        throw new Error(`iTunes API error: ${error.response.status}`);
      }
      throw new Error(`Failed to search podcasts: ${error.message}`);
    }
  }

  /**
   * Get all downloaded episodes across all podcasts
   */
  getDownloadedEpisodes(): Episode[] {
    return this.db.getDownloadedEpisodes.all() as Episode[];
  }
}

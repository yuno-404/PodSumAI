import fs from "fs";
import path from "path";
import axios from "axios";
import os from "os";
import { DatabaseManager } from "../database/index.js";
import type { AudioProvisionResult, Episode } from "../../shared/types.js";

/**
 * AudioService - Flow B: Audio Asset Provisioning
 *
 * Responsibilities:
 * - Provision audio files for AI processing
 * - Return local path if file is downloaded (isEphemeral = false)
 * - Download to temp if not in vault (isEphemeral = true)
 * - Handle persistent downloads for user's music library
 */
export class AudioService {
  private tempDir = path.join(os.tmpdir(), "myapp-cache");

  constructor(private db: DatabaseManager) {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Provision audio file for AI processing
   *
   * Strategy:
   * 1. Check if episode is downloaded (is_downloaded = 1)
   * 2. If yes and file exists, return local path (isEphemeral = false)
   * 3. If no, download to temp (isEphemeral = true)
   *
   * @param episodeId - Episode ID
   * @returns Audio file path and ephemeral flag
   */
  async provisionAudio(episodeId: string): Promise<AudioProvisionResult> {
    const episode = this.db.getEpisodeById.get(episodeId) as
      | Episode
      | undefined;

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    // Check local vault first
    if (episode.is_downloaded && episode.local_file_path) {
      if (fs.existsSync(episode.local_file_path)) {
        return {
          path: episode.local_file_path,
          isEphemeral: false,
        };
      } else {
        // File marked as downloaded but missing - reset flag
        this.db.updateEpisodeDownloadStatus.run(0, null, episodeId);
      }
    }

    // Download to temp
    const tempPath = path.join(this.tempDir, `${episodeId}.mp3`);
    await this.downloadStream(episode.audio_url, tempPath);

    return {
      path: tempPath,
      isEphemeral: true,
    };
  }

  /**
   * Download episode to persistent storage (user's music library)
   *
   * Path: ~/Music/Podcasts/{podcast_title}/{episode_title}.mp3
   *
   * @param episodeId - Episode ID
   * @param podcastTitle - Podcast title (used as subfolder)
   * @returns Downloaded file path
   */
  async downloadToPersistent(
    episodeId: string,
    podcastTitle: string,
  ): Promise<string> {
    const episode = this.db.getEpisodeById.get(episodeId) as
      | Episode
      | undefined;

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    // Sanitize folder and filename
    const sanitizedPodcast = podcastTitle.replace(/[^a-zA-Z0-9\s\-_]/g, "_");
    const sanitizedTitle = episode.title.replace(/[^a-zA-Z0-9\s\-_]/g, "_");
    const fileName = `${sanitizedTitle}.mp3`;

    // ~/Music/Podcasts/{podcast_title}/{episode_title}.mp3
    const destDir = path.join(
      os.homedir(),
      "Music",
      "Podcasts",
      sanitizedPodcast,
    );

    // Ensure directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destPath = path.join(destDir, fileName);

    // Download file
    await this.downloadStream(episode.audio_url, destPath);

    // Update DB
    this.db.updateEpisodeDownloadStatus.run(1, destPath, episodeId);

    return destPath;
  }

  /**
   * Download audio file via HTTP stream
   *
   * @param url - Audio URL
   * @param destPath - Destination file path
   * @param onProgress - Optional progress callback
   */
  private async downloadStream(
    url: string,
    destPath: string,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 60000, // 60 seconds for connection
      maxRedirects: 5,
      headers: {
        "User-Agent": "Podcast-AI-Orchestrator/1.0",
      },
    });

    const totalLength = response.headers["content-length"];
    let downloadedLength = 0;

    const writer = fs.createWriteStream(destPath);

    response.data.on("data", (chunk: Buffer) => {
      downloadedLength += chunk.length;

      if (onProgress && totalLength) {
        const percent = Math.round(
          (downloadedLength / parseInt(totalLength)) * 100,
        );
        onProgress(percent);
      }
    });

    return new Promise((resolve, reject) => {
      // Use pipeline or manual handling
      response.data.pipe(writer);

      // Listen for finish event - fired when all data has been written and flushed
      writer.on("finish", () => {
        // Give a small delay to ensure file system catches up
        setImmediate(() => {
          // Verify file was written
          if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            if (stats.size > 0) {
              resolve();
            } else {
              reject(new Error("Downloaded file is empty"));
            }
          } else {
            reject(new Error("Downloaded file not found"));
          }
        });
      });

      writer.on("error", (err) => {
        writer.destroy();
        // Clean up partial file
        try {
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
          }
        } catch (unlinkErr) {
          // Ignore - file may have been deleted already
        }
        reject(err);
      });

      response.data.on("error", (err: Error) => {
        writer.destroy();
        // Clean up partial file
        try {
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
          }
        } catch (unlinkErr) {
          // Ignore - file may have been deleted already
        }
        reject(err);
      });
    });
  }

  /**
   * Delete downloaded episode file
   * Returns the file path that was marked for deletion (actual deletion handled by IPC to use shell.moveItemToTrash)
   *
   * @param episodeId - Episode ID
   * @returns The file path that was cleared from DB, or null if not downloaded
   */
  deleteDownload(episodeId: string): string | null {
    const episode = this.db.getEpisodeById.get(episodeId) as
      | Episode
      | undefined;

    if (!episode || !episode.local_file_path) {
      return null;
    }

    const filePath = episode.local_file_path;

    // Update DB first
    this.db.updateEpisodeDownloadStatus.run(0, null, episodeId);

    return filePath;
  }

  /**
   * Actually delete a file from disk
   *
   * @param filePath - Path to file to delete
   * @returns true if deleted successfully, false otherwise
   */
  deleteFile(filePath: string): boolean {
    if (!filePath) {
      console.warn("[AudioService] No file path provided for deletion");
      return false;
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`[AudioService] File does not exist: ${filePath}`);
      return false;
    }

    try {
      fs.unlinkSync(filePath);
      console.log(`[AudioService] Successfully deleted file: ${filePath}`);
      return true;
    } catch (error: any) {
      console.error(
        `[AudioService] Failed to delete file: ${filePath}`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Get download progress for an episode (if downloading)
   * Returns null if not downloading
   */
  getDownloadProgress(_episodeId: string): number | null {
    // TODO: Implement download queue with progress tracking
    return null;
  }
}

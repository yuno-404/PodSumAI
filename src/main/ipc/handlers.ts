import { ipcMain, IpcMainInvokeEvent, shell } from "electron";
import { PodcastService } from "../services/PodcastService.js";
import { AudioService } from "../services/AudioService.js";
import { GeminiService } from "../services/GeminiService.js";
import { ConfigService } from "../services/ConfigService.js";
import type {
  IPCResponse,
  Podcast,
  Episode,
  Document,
  PodcastSearchResult,
  DbStats,
} from "../../shared/types.js";

/**
 * Service container
 */
export interface Services {
  podcast: PodcastService;
  audio: AudioService;
  gemini: GeminiService;
  config: ConfigService;
}

/**
 * Wrap an IPC handler with standardized error handling.
 *
 * Eliminates repeated try/catch boilerplate across all handlers.
 * Every handler returns { success, data } or { success: false, error }.
 */
function wrapHandler<T>(
  name: string,
  fn: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<T> | T,
): (event: IpcMainInvokeEvent, ...args: any[]) => Promise<IPCResponse<T>> {
  return async (event, ...args) => {
    try {
      const data = await fn(event, ...args);
      return { success: true, data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${name} error:`, error);
      return { success: false, error: message };
    }
  };
}

/**
 * Register all IPC handlers
 *
 * Pattern: Thin controller layer
 * - No business logic
 * - Parameter validation only
 * - Delegate to services
 * - Return standardized { success, data } or { success, error }
 */
export function registerHandlers(services: Services) {
  // ===== Podcast Handlers =====

  ipcMain.handle(
    "get_episodes",
    wrapHandler<Episode[]>("get_episodes", (_, podcastId: string) => {
      return services.podcast.getEpisodes(podcastId);
    }),
  );

  ipcMain.handle(
    "subscribe_podcast",
    wrapHandler<{ podcastId: string; newCount: number }>(
      "subscribe_podcast",
      async (event, url: string, artworkUrl?: string) => {
        const result = await services.podcast.syncPodcast(url, artworkUrl);

        // Emit event for UI update
        event.sender.send("feed_synced", {
          type: "feed_synced",
          podcastId: result.podcastId,
          newCount: result.newCount,
        });

        return result;
      },
    ),
  );

  ipcMain.handle(
    "search_podcasts",
    wrapHandler<PodcastSearchResult[]>(
      "search_podcasts",
      async (_, query: string) => {
        if (!query || query.trim().length < 1) {
          throw new Error("Please enter a search keyword");
        }
        return services.podcast.searchPodcasts(query.trim());
      },
    ),
  );

  ipcMain.handle(
    "get_podcasts",
    wrapHandler<Podcast[]>("get_podcasts", () => {
      return services.podcast.getAllPodcasts();
    }),
  );

  ipcMain.handle(
    "get_podcast",
    wrapHandler<Podcast>("get_podcast", (_, podcastId: string) => {
      const podcast = services.podcast.getPodcastById(podcastId);
      if (!podcast) {
        throw new Error("Podcast not found");
      }
      return podcast;
    }),
  );

  ipcMain.handle(
    "update_custom_prompt",
    wrapHandler<void>(
      "update_custom_prompt",
      (_, podcastId: string, prompt: string | null) => {
        services.podcast.updateCustomPrompt(podcastId, prompt);
      },
    ),
  );

  ipcMain.handle(
    "delete_podcast",
    wrapHandler<void>(
      "delete_podcast",
      async (_, podcastId: string, permanent: boolean) => {
        if (permanent) {
          await services.podcast.deletePodcast(podcastId);
        } else {
          services.podcast.unsubscribePodcast(podcastId);
        }
      },
    ),
  );

  // ===== AI Summary Handlers =====

  ipcMain.handle(
    "run_ai_summary",
    wrapHandler<string>("run_ai_summary", async (event, episodeId: string) => {
      // Check if already generating
      const status = services.gemini.getGeneratingStatus();
      if (status.isGenerating) {
        throw new Error("ALREADY_GENERATING");
      }

      console.log(`Starting AI summary for episode: ${episodeId}`);
      const markdown = await services.gemini.generateSummary(episodeId);

      // Emit success event for UI update
      event.sender.send("summary_completed", {
        type: "summary_completed",
        episodeId,
      });

      return markdown;
    }),
  );

  ipcMain.handle(
    "get_generating_status",
    wrapHandler<{ isGenerating: boolean; episodeId: string | null }>(
      "get_generating_status",
      () => {
        return services.gemini.getGeneratingStatus();
      },
    ),
  );

  ipcMain.handle(
    "get_documents",
    wrapHandler<Document[]>("get_documents", (_, episodeId: string) => {
      return services.gemini.getDocuments(episodeId);
    }),
  );

  ipcMain.handle(
    "get_documents_by_podcast",
    wrapHandler<any[]>("get_documents_by_podcast", (_, podcastId: string) => {
      return services.gemini.getDocumentsByPodcast(podcastId);
    }),
  );

  ipcMain.handle(
    "delete_summary",
    wrapHandler<void>("delete_summary", (_, documentId: string) => {
      services.gemini.deleteSummary(documentId);
    }),
  );

  // ===== Download Handlers =====

  ipcMain.handle(
    "download_episode",
    wrapHandler<{ path: string }>(
      "download_episode",
      async (_, episodeId: string, podcastTitle: string) => {
        const filePath = await services.audio.downloadToPersistent(
          episodeId,
          podcastTitle,
        );
        return { path: filePath };
      },
    ),
  );

  ipcMain.handle(
    "delete_download",
    wrapHandler<void>("delete_download", async (_, episodeId: string) => {
      const filePath = services.audio.deleteDownload(episodeId);
      if (filePath) {
        const trashed = await services.audio.trashFile(filePath);
        if (!trashed) {
          throw new Error("Failed to move file to trash");
        }
      }
    }),
  );

  ipcMain.handle(
    "get_downloaded_episodes",
    wrapHandler<Episode[]>("get_downloaded_episodes", () => {
      return services.podcast.getDownloadedEpisodes();
    }),
  );

  // ===== Utility Handlers =====

  ipcMain.handle(
    "get_download_path",
    wrapHandler<string>("get_download_path", () => {
      return services.audio.getDownloadDir();
    }),
  );

  ipcMain.handle(
    "open_download_folder",
    wrapHandler<void>("open_download_folder", async () => {
      const dir = services.audio.getDownloadDir();
      await shell.openPath(dir);
    }),
  );

  ipcMain.handle(
    "get_db_stats",
    wrapHandler<DbStats>("get_db_stats", () => {
      return services.config.getDbStats();
    }),
  );

  // ===== API Key Handlers =====

  ipcMain.handle(
    "save_api_key",
    wrapHandler<void>("save_api_key", (_, apiKey: string) => {
      services.config.saveApiKey(apiKey);
      services.gemini.updateApiKey(apiKey);
    }),
  );

  ipcMain.handle(
    "get_api_key",
    wrapHandler<string>("get_api_key", () => {
      return services.config.getApiKey();
    }),
  );

  ipcMain.handle(
    "remove_api_key",
    wrapHandler<void>("remove_api_key", () => {
      services.config.removeApiKey();
      services.gemini.updateApiKey("");
    }),
  );

  ipcMain.handle(
    "open_env_folder",
    wrapHandler<void>("open_env_folder", async () => {
      const envPath = services.config.getEnvPath();
      await shell.showItemInFolder(envPath);
    }),
  );

  // ===== Sync All Podcasts =====

  ipcMain.handle(
    "sync_all_podcasts",
    wrapHandler<{ synced: number }>(
      "sync_all_podcasts",
      async (event) => {
        const podcasts = services.podcast.getAllPodcasts();
        let synced = 0;

        for (const podcast of podcasts) {
          try {
            const result = await services.podcast.syncPodcast(podcast.feed_url);
            event.sender.send("feed_synced", {
              type: "feed_synced",
              podcastId: result.podcastId,
              newCount: result.newCount,
            });
            synced++;
          } catch (error) {
            console.error(
              `Failed to sync podcast: ${podcast.title}`,
              error,
            );
          }
        }

        return { synced };
      },
    ),
  );

  console.log("IPC handlers registered successfully");
}

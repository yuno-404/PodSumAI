import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload Script - IPC Bridge
 *
 * Purpose: Securely expose IPC methods to renderer process
 *
 * Security:
 * - contextBridge prevents direct Node.js access
 * - Only whitelisted methods are exposed
 * - No eval or arbitrary code execution
 */

contextBridge.exposeInMainWorld("api", {
  // ===== Podcast Methods =====

  getEpisodes: (podcastId: string) =>
    ipcRenderer.invoke("get_episodes", podcastId),

  subscribePodcast: (url: string, artworkUrl?: string) =>
    ipcRenderer.invoke("subscribe_podcast", url, artworkUrl),

  searchPodcasts: (query: string) =>
    ipcRenderer.invoke("search_podcasts", query),

  getPodcasts: () => ipcRenderer.invoke("get_podcasts"),

  getPodcast: (podcastId: string) =>
    ipcRenderer.invoke("get_podcast", podcastId),

  updateCustomPrompt: (podcastId: string, prompt: string | null) =>
    ipcRenderer.invoke("update_custom_prompt", podcastId, prompt),

  deletePodcast: (podcastId: string, permanent: boolean) =>
    ipcRenderer.invoke("delete_podcast", podcastId, permanent),

  // ===== AI Summary Methods =====

  runAiSummary: (episodeId: string) =>
    ipcRenderer.invoke("run_ai_summary", episodeId),

  getGeneratingStatus: () => ipcRenderer.invoke("get_generating_status"),

  getDocuments: (episodeId: string) =>
    ipcRenderer.invoke("get_documents", episodeId),

  getDocumentsByPodcast: (podcastId: string) =>
    ipcRenderer.invoke("get_documents_by_podcast", podcastId),

  deleteSummary: (documentId: string) =>
    ipcRenderer.invoke("delete_summary", documentId),

  // ===== Download Methods =====

  downloadEpisode: (episodeId: string, destDir: string) =>
    ipcRenderer.invoke("download_episode", episodeId, destDir),

  deleteDownload: (episodeId: string) =>
    ipcRenderer.invoke("delete_download", episodeId),

  getDownloadedEpisodes: () => ipcRenderer.invoke("get_downloaded_episodes"),

  // ===== Utility Methods =====

  getDownloadPath: () => ipcRenderer.invoke("get_download_path"),

  openDownloadFolder: () => ipcRenderer.invoke("open_download_folder"),

  getDbStats: () => ipcRenderer.invoke("get_db_stats"),

  // ===== API Key Methods =====

  saveApiKey: (apiKey: string) => ipcRenderer.invoke("save_api_key", apiKey),

  getApiKey: () => ipcRenderer.invoke("get_api_key"),

  removeApiKey: () => ipcRenderer.invoke("remove_api_key"),

  openEnvFolder: () => ipcRenderer.invoke("open_env_folder"),

  syncAllPodcasts: () => ipcRenderer.invoke("sync_all_podcasts"),

  // ===== Event Listeners =====

  onFeedSynced: (
    callback: (data: {
      type: string;
      podcastId: string;
      newCount: number;
    }) => void,
  ) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on("feed_synced", subscription);
    return () => ipcRenderer.removeListener("feed_synced", subscription);
  },

  onSummaryCompleted: (
    callback: (data: { type: string; episodeId: string }) => void,
  ) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on("summary_completed", subscription);
    return () => ipcRenderer.removeListener("summary_completed", subscription);
  },

  onSummaryFailed: (
    callback: (data: {
      type: string;
      episodeId: string;
      error: string;
    }) => void,
  ) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on("summary_failed", subscription);
    return () => ipcRenderer.removeListener("summary_failed", subscription);
  },

  onDownloadProgress: (
    callback: (data: {
      type: string;
      episodeId: string;
      percent: number;
    }) => void,
  ) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on("download_progress", subscription);
    return () => ipcRenderer.removeListener("download_progress", subscription);
  },
});

// Expose platform info
contextBridge.exposeInMainWorld("platform", {
  isMac: process.platform === "darwin",
  isWindows: process.platform === "win32",
  isLinux: process.platform === "linux",
});

console.log("Preload script loaded");

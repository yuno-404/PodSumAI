import type { IPCResponse, PodcastSearchResult } from "../shared/types";
import type { Episode, Podcast, Document } from "../shared/types";

export {};

declare global {
  interface Window {
    api: {
      // Podcast Methods
      getEpisodes: (podcastId: string) => Promise<IPCResponse<Episode[]>>;
      subscribePodcast: (
        url: string,
        artworkUrl?: string,
      ) => Promise<IPCResponse<{ podcastId: string; newCount: number }>>;
      getPodcasts: () => Promise<IPCResponse<Podcast[]>>;
      getPodcast: (podcastId: string) => Promise<IPCResponse<Podcast>>;
      searchPodcasts: (
        query: string,
      ) => Promise<IPCResponse<PodcastSearchResult[]>>;
      updateCustomPrompt: (
        podcastId: string,
        prompt: string | null,
      ) => Promise<IPCResponse<void>>;
      deletePodcast: (podcastId: string) => Promise<IPCResponse<void>>;

      // AI Summary Methods
      runAiSummary: (episodeId: string) => Promise<IPCResponse<string>>;
      getGeneratingStatus: () => Promise<
        IPCResponse<{ isGenerating: boolean; episodeId: string | null }>
      >;
      getDocuments: (episodeId: string) => Promise<IPCResponse<Document[]>>;
      getDocumentsByPodcast: (podcastId: string) => Promise<IPCResponse<any[]>>;
      deleteSummary: (documentId: string) => Promise<IPCResponse<void>>;

      // Download Methods
      downloadEpisode: (
        episodeId: string,
        destDir: string,
      ) => Promise<IPCResponse<{ path: string }>>;
      deleteDownload: (episodeId: string) => Promise<IPCResponse<void>>;
      getDownloadedEpisodes: () => Promise<IPCResponse<Episode[]>>;

      // Utility Methods
      getDbStats: () => Promise<
        IPCResponse<{ podcasts: number; episodes: number; documents: number }>
      >;

      // API Key Methods
      saveApiKey: (apiKey: string) => Promise<IPCResponse<void>>;
      getApiKey: () => Promise<IPCResponse<string>>;

      // Event Listeners
      onFeedSynced: (
        callback: (data: {
          type: string;
          podcastId: string;
          newCount: number;
        }) => void,
      ) => () => void;
      onSummaryCompleted: (
        callback: (data: { type: string; episodeId: string }) => void,
      ) => () => void;
      onSummaryFailed: (
        callback: (data: {
          type: string;
          episodeId: string;
          error: string;
        }) => void,
      ) => () => void;
      onDownloadProgress: (
        callback: (data: {
          type: string;
          episodeId: string;
          percent: number;
        }) => void,
      ) => () => void;
    };

    platform: {
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
    };
  }
}

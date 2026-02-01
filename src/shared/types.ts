/**
 * Shared types used across main and renderer processes
 */

// ===== Database Models =====

export interface Podcast {
  id: string;
  title: string;
  feed_url: string;
  artwork_url: string | null;
  custom_prompt: string | null;
  last_fetched_at: string | null; // UTC ISO format
  is_subscribed: number; // 1 = subscribed, 0 = soft-deleted
}

export interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  pub_date: string; // UTC ISO format
  duration: number; // seconds
  audio_url: string;
  is_downloaded: boolean;
  local_file_path: string | null;
}

export interface Document {
  id: string;
  episode_id: string;
  content: string; // Markdown format
  created_at: string; // UTC ISO format
  used_prompt: string | null;
}

// ===== IPC Response Types =====

export type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ===== Service Types =====

export interface RSSFeed {
  podcast: {
    title: string;
    feed_url: string;
    artwork_url?: string;
  };
  episodes: Array<{
    guid: string;
    title: string;
    pub_date: string; // UTC ISO format
    duration: number;
    audio_url: string;
  }>;
}

export interface PodcastSearchResult {
  id: string; // iTunes collection ID
  title: string; // Podcast name
  author: string; // Publisher/Artist
  feedUrl: string; // RSS feed URL
  artworkUrl: string; // Cover image URL
  description: string; // Brief description
}

export interface AudioProvisionResult {
  path: string;
  isEphemeral: boolean;
}

// ===== IPC Event Types =====

export type IPCEventType =
  | "summary_completed"
  | "summary_failed"
  | "download_progress"
  | "feed_synced";

export interface SummaryCompletedEvent {
  type: "summary_completed";
  episodeId: string;
}

export interface SummaryFailedEvent {
  type: "summary_failed";
  episodeId: string;
  error: string;
}

export interface DownloadProgressEvent {
  type: "download_progress";
  episodeId: string;
  percent: number; // 0-100
}

export interface FeedSyncedEvent {
  type: "feed_synced";
  podcastId: string;
  newCount: number;
}

export type IPCEvent =
  | SummaryCompletedEvent
  | SummaryFailedEvent
  | DownloadProgressEvent
  | FeedSyncedEvent;

// ===== Utility Types =====

export interface DbStats {
  podcasts: number;
  episodes: number;
  documents: number;
  downloaded: number;
}

// ===== Error Types =====

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class GeminiAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiAPIError";
  }
}

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}

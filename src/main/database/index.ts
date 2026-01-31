import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type { DbStats } from "../../shared/types.js";

export class DatabaseManager {
  public db: Database.Database;

  // Prepared statements
  public upsertPodcast!: Database.Statement;
  public getPodcasts!: Database.Statement;
  public getPodcastById!: Database.Statement;
  public getPodcastByFeedUrl!: Database.Statement;
  public updatePodcastPrompt!: Database.Statement;
  public deletePodcast!: Database.Statement;
  public upsertEpisode!: Database.Statement;
  public getEpisodesByPodcast!: Database.Statement;
  public getEpisodeById!: Database.Statement;
  public updateEpisodeDownloadStatus!: Database.Statement;
  public getDownloadedEpisodes!: Database.Statement;
  public insertDocument!: Database.Statement;
  public getDocumentsByEpisode!: Database.Statement;
  public getDocumentById!: Database.Statement;
  public deleteDocument!: Database.Statement;
  public deleteDocumentsByEpisode!: Database.Statement;
  public hasDocuments!: Database.Statement;
  public getDocumentsByPodcast!: Database.Statement;
  public getDocumentsByEpisodes!: Database.Statement;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
    this.initStatements();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS podcasts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          feed_url TEXT NOT NULL UNIQUE,
          artwork_url TEXT,
          custom_prompt TEXT,
          last_fetched_at TEXT
      );

      CREATE TABLE IF NOT EXISTS episodes (
          id TEXT PRIMARY KEY,
          podcast_id TEXT NOT NULL,
          title TEXT NOT NULL,
          pub_date TEXT NOT NULL,
          duration INTEGER,
          audio_url TEXT NOT NULL,
          is_downloaded BOOLEAN DEFAULT 0,
          local_file_path TEXT,
          FOREIGN KEY(podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          used_prompt TEXT,
          FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
      CREATE INDEX IF NOT EXISTS idx_episodes_pub_date ON episodes(pub_date DESC);
      CREATE INDEX IF NOT EXISTS idx_documents_episode_id ON documents(episode_id);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
    `);
  }

  private initStatements() {
    // ===== Podcasts =====
    this.upsertPodcast = this.db.prepare(`
      INSERT INTO podcasts (id, title, feed_url, artwork_url, last_fetched_at, custom_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(feed_url) DO UPDATE SET
        title = excluded.title,
        artwork_url = excluded.artwork_url,
        last_fetched_at = excluded.last_fetched_at
      RETURNING id
    `);

    this.getPodcasts = this.db.prepare(
      "SELECT * FROM podcasts ORDER BY title ASC",
    );

    this.getPodcastById = this.db.prepare(
      "SELECT * FROM podcasts WHERE id = ?",
    );

    this.getPodcastByFeedUrl = this.db.prepare(
      "SELECT * FROM podcasts WHERE feed_url = ?",
    );

    this.updatePodcastPrompt = this.db.prepare(`
      UPDATE podcasts SET custom_prompt = ? WHERE id = ?
    `);

    this.deletePodcast = this.db.prepare("DELETE FROM podcasts WHERE id = ?");

    // ===== Episodes =====

    // CRITICAL: This upsert does NOT overwrite is_downloaded or local_file_path
    this.upsertEpisode = this.db.prepare(`
      INSERT INTO episodes (id, podcast_id, title, pub_date, duration, audio_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        duration = excluded.duration,
        audio_url = excluded.audio_url
        -- DO NOT UPDATE is_downloaded or local_file_path
    `);

    this.getEpisodesByPodcast = this.db.prepare(`
      SELECT * FROM episodes
      WHERE podcast_id = ?
      ORDER BY pub_date DESC
    `);

    this.getEpisodeById = this.db.prepare(
      "SELECT * FROM episodes WHERE id = ?",
    );

    this.updateEpisodeDownloadStatus = this.db.prepare(`
      UPDATE episodes
      SET is_downloaded = ?, local_file_path = ?
      WHERE id = ?
    `);

    this.getDownloadedEpisodes = this.db.prepare(`
      SELECT * FROM episodes
      WHERE is_downloaded = 1
      ORDER BY pub_date DESC
    `);

    // ===== Documents =====

    this.insertDocument = this.db.prepare(`
      INSERT INTO documents (id, episode_id, content, created_at, used_prompt)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.getDocumentsByEpisode = this.db.prepare(`
      SELECT * FROM documents
      WHERE episode_id = ?
      ORDER BY created_at DESC
    `);

    this.getDocumentById = this.db.prepare(
      "SELECT * FROM documents WHERE id = ?",
    );

    this.deleteDocument = this.db.prepare("DELETE FROM documents WHERE id = ?");

    this.deleteDocumentsByEpisode = this.db.prepare(
      "DELETE FROM documents WHERE episode_id = ?",
    );

    this.hasDocuments = this.db.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE episode_id = ?
    `);

    this.getDocumentsByPodcast = this.db.prepare(`
      SELECT d.*, e.title as episode_title, e.pub_date as episode_pub_date
      FROM documents d
      JOIN episodes e ON d.episode_id = e.id
      WHERE e.podcast_id = ?
      ORDER BY d.created_at DESC
    `);

    this.getDocumentsByEpisodes = this.db.prepare(`
      SELECT * FROM documents
      WHERE episode_id IN (${Array(100).fill("?").join(",")})
      ORDER BY created_at DESC
    `);
  }

  // ===== Utility Methods =====

  /**
   * Wraps a function in a SQLite transaction for atomic operations
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Generates a new UUID for database records
   */
  generateId(): string {
    return randomUUID();
  }

  /**
   * Returns current UTC timestamp in ISO format
   */
  now(): string {
    return new Date().toISOString();
  }

  /**
   * Close the database connection
   */
  close() {
    this.db.close();
  }

  /**
   * Get database statistics for debugging
   */
  getStats(): DbStats {
    const podcastCount = this.db
      .prepare("SELECT COUNT(*) as count FROM podcasts")
      .get() as { count: number };
    const episodeCount = this.db
      .prepare("SELECT COUNT(*) as count FROM episodes")
      .get() as { count: number };
    const documentCount = this.db
      .prepare("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    const downloadedCount = this.db
      .prepare("SELECT COUNT(*) as count FROM episodes WHERE is_downloaded = 1")
      .get() as { count: number };

    return {
      podcasts: podcastCount.count,
      episodes: episodeCount.count,
      documents: documentCount.count,
      downloaded: downloadedCount.count,
    };
  }
}

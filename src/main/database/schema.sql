-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Set busy timeout to 5 seconds to handle concurrent access
PRAGMA busy_timeout = 5000;

-- Podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    feed_url TEXT NOT NULL UNIQUE,
    artwork_url TEXT,
    custom_prompt TEXT,
    last_fetched_at TEXT
);

-- Episodes table
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

-- Documents table (AI-generated summaries)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    used_prompt TEXT,
    FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_pub_date ON episodes(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_episode_id ON documents(episode_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

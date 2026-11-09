-- LumenFolio schema (D1 / SQLite)

PRAGMA foreign_keys = ON;

-- Key/value store. Key 'site' holds the whole site settings JSON blob.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS galleries (
  id             TEXT PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  cover_image_id TEXT,
  event_date     TEXT,
  event_end_date TEXT,
  location       TEXT,
  tags           TEXT,            -- JSON array of strings
  ai_generated   INTEGER DEFAULT 0,
  sort_order     INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'published',   -- published | draft
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT
);

CREATE TABLE IF NOT EXISTS images (
  id          TEXT PRIMARY KEY,
  gallery_id  TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  width       INTEGER,
  height      INTEGER,
  alt         TEXT,
  caption     TEXT,
  tags        TEXT,               -- JSON array of strings
  variants    TEXT,               -- JSON array of widths
  sort_order  INTEGER DEFAULT 0,
  ai_caption  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_images_gallery ON images(gallery_id);

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TEXT NOT NULL,      -- ISO date
  end_date    TEXT,
  time        TEXT,
  location    TEXT,
  gallery_id  TEXT,
  status      TEXT DEFAULT 'published',
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT,             -- HTML or Markdown
  cover_image_id TEXT,
  tags          TEXT,
  status        TEXT DEFAULT 'published',
  published_at  TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS pages (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  status      TEXT DEFAULT 'published',
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT
);

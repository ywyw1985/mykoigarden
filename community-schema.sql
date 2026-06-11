CREATE TABLE IF NOT EXISTS community_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL DEFAULT 'community',
  lang TEXT NOT NULL DEFAULT 'en',
  topic TEXT,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  pond_info TEXT,
  owner_reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  approved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_community_comments_status_page_lang
ON community_comments (status, page, lang, approved_at);

CREATE TABLE IF NOT EXISTS community_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL,
  page TEXT NOT NULL DEFAULT 'community',
  lang TEXT NOT NULL DEFAULT 'en',
  name TEXT,
  email TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  approved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_community_uploads_status_page_lang
ON community_uploads (status, page, lang, approved_at);

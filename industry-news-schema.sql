CREATE TABLE IF NOT EXISTS industry_news_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'learning',
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  summary TEXT,
  confidence TEXT NOT NULL DEFAULT 'review-needed',
  region TEXT DEFAULT 'Global',
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_industry_news_public
ON industry_news_items (status, published_at);

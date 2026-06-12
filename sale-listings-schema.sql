CREATE TABLE IF NOT EXISTS sale_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  variety TEXT,
  size_text TEXT,
  sex TEXT,
  price TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  image_data_url TEXT,
  notes TEXT,
  location_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_listings_status_updated
ON sale_listings (status, updated_at);

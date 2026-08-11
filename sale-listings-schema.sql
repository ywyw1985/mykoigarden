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

CREATE TABLE IF NOT EXISTS local_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lang TEXT NOT NULL DEFAULT 'en',
  listing_type TEXT NOT NULL,
  title TEXT NOT NULL,
  variety TEXT,
  size_text TEXT,
  price TEXT,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  latitude REAL,
  longitude REAL,
  location_label TEXT,
  health_note TEXT,
  notes TEXT,
  seller_name TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  image_data_url TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  listing_status TEXT NOT NULL DEFAULT 'available',
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  expires_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_listings_public
ON local_listings (moderation_status, listing_status, expires_at, created_at);

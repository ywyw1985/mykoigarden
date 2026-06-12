ALTER TABLE community_comments ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_comments ADD COLUMN deleted_at TEXT;
ALTER TABLE community_comments ADD COLUMN notified_at TEXT;

CREATE INDEX IF NOT EXISTS idx_community_comments_public_order
ON community_comments (status, page, lang, pinned, approved_at);

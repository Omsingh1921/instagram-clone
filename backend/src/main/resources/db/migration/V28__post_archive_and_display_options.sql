-- Instagram Clone: Post Archival, Like Privacy, Alt Text & Recently Deleted (V28)

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hide_like_count BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_user_archived ON posts (user_id, is_archived, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_recently_deleted ON posts (user_id, is_deleted, deleted_at DESC);

ALTER TABLE post_media ADD COLUMN IF NOT EXISTS alt_text VARCHAR(500) NULL;
ALTER TABLE post_media ADD COLUMN IF NOT EXISTS filter_name VARCHAR(50) NULL DEFAULT 'NORMAL';

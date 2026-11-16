-- Instagram Clone: Pseudo-Permanent Soft Delete for Reels (V31)
ALTER TABLE reels
ADD COLUMN is_permanently_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN permanently_deleted_at TIMESTAMP NULL;

CREATE INDEX idx_reels_permanent_deleted ON reels(user_id, is_deleted, is_permanently_deleted);

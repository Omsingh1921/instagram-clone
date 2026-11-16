-- Instagram Clone: Reels Archive, Location, Pinned & Moderation Options (V29)
ALTER TABLE reels
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP NULL,
ADD COLUMN location VARCHAR(255) NULL,
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN hide_like_count BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN comments_disabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN remix_reel_id UUID NULL,
ADD CONSTRAINT fk_reels_remix FOREIGN KEY (remix_reel_id) REFERENCES reels(id) ON DELETE SET NULL;

CREATE INDEX idx_reels_archive_deleted ON reels(user_id, is_archived, is_deleted);
CREATE INDEX idx_reels_audio ON reels(audio_title, is_deleted);
CREATE INDEX idx_reels_pinned ON reels(user_id, is_pinned);

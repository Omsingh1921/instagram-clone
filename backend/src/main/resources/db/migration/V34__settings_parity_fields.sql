-- V34: Additional Instagram settings parity fields
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_like_and_share_counts BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_tags_from VARCHAR(30) NOT NULL DEFAULT 'EVERYONE';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_mentions_from VARCHAR(30) NOT NULL DEFAULT 'EVERYONE';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS save_stories_to_archive BOOLEAN NOT NULL DEFAULT TRUE;

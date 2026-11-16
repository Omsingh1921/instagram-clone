-- Instagram Clone: Content Controls, User Mutes, and Creator Account Types Migration (V24)

-- 1. Post Content Controls: Location, Comments Disabling, and Pinning
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_disabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP NULL;

-- 2. Professional & Creator Accounts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL;

-- 3. Comment Filter Settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS filtered_keywords TEXT NULL;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_offensive_comments BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. User Muting Table
CREATE TABLE IF NOT EXISTS user_mutes (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    muted_user_id UUID NOT NULL,
    mute_posts BOOLEAN NOT NULL DEFAULT TRUE,
    mute_stories BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mutes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mutes_target
        FOREIGN KEY (muted_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_mute UNIQUE (user_id, muted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_pinned ON posts(user_id, is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_mutes_user ON user_mutes(user_id);

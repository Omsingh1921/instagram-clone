-- Instagram Clone: Post and Reel Share Tracking Migration (V23)

-- 1. Create post_shares table
CREATE TABLE IF NOT EXISTS post_shares (
    id UUID NOT NULL PRIMARY KEY,
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    share_type VARCHAR(30) NOT NULL DEFAULT 'COPY_LINK',
    recipient_id UUID NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_post_shares_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

    CONSTRAINT fk_post_shares_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_post_shares_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares (post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares (user_id);

-- 2. Create reel_shares table
CREATE TABLE IF NOT EXISTS reel_shares (
    id UUID NOT NULL PRIMARY KEY,
    reel_id UUID NOT NULL,
    user_id UUID NOT NULL,
    share_type VARCHAR(30) NOT NULL DEFAULT 'COPY_LINK',
    recipient_id UUID NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reel_shares_reel
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,

    CONSTRAINT fk_reel_shares_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_reel_shares_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reel_shares_reel_id ON reel_shares (reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_shares_user_id ON reel_shares (user_id);

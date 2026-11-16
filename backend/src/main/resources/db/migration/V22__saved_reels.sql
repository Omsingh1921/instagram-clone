-- Instagram Clone: Saved Reels Migration (V22)
CREATE TABLE IF NOT EXISTS saved_reels (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    reel_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_reels_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_saved_reels_reel
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,

    CONSTRAINT uk_saved_reels UNIQUE (user_id, reel_id)
);

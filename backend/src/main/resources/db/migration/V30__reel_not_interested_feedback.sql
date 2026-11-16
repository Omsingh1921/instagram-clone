-- Instagram Clone: Reel Not Interested Feedback Migration (V30)
CREATE TABLE IF NOT EXISTS reel_not_interested (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    reel_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reel_not_interested_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_reel_not_interested_reel
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,

    CONSTRAINT uk_reel_not_interested UNIQUE (user_id, reel_id)
);

CREATE INDEX idx_reel_not_interested_user ON reel_not_interested(user_id);
CREATE INDEX idx_reel_not_interested_reel ON reel_not_interested(reel_id);

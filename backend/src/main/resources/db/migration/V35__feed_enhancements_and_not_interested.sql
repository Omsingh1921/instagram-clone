-- Instagram Clone: Post Not Interested Feedback & Dynamic Feed Config Migration (V35)
CREATE TABLE IF NOT EXISTS post_not_interested (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_post_not_interested_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_post_not_interested_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

    CONSTRAINT uk_post_not_interested UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_not_interested_user ON post_not_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_post_not_interested_post ON post_not_interested(post_id);

CREATE TABLE IF NOT EXISTS dynamic_feed_configs (
    id UUID NOT NULL PRIMARY KEY,
    weight_share DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    weight_save DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    weight_comment DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    weight_like DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    author_affinity_weight DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    topic_affinity_weight DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    following_bonus DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    recency_gravity_decay DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    anti_clustering_window INT NOT NULL DEFAULT 4,
    posts_per_reel INT NOT NULL DEFAULT 3,
    seen_post_penalty_multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    suggested_creators_interval INT NOT NULL DEFAULT 7,
    all_caught_up_hours_threshold INT NOT NULL DEFAULT 72,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_dynamic_feed_configs_active ON dynamic_feed_configs(is_active);


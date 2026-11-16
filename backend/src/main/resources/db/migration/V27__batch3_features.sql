-- Instagram Clone: Batch 3 Features Migration (V27)
-- User Tagging and Pinned Chats

-- 1. Post User Tagging
CREATE TABLE IF NOT EXISTS post_user_tags (
    id UUID NOT NULL PRIMARY KEY,
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    x_coord DOUBLE PRECISION NULL DEFAULT 0.5,
    y_coord DOUBLE PRECISION NULL DEFAULT 0.5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_post_user_tags_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_user_tags_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_post_user_tag
        UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_user_tags_user ON post_user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_post_user_tags_post ON post_user_tags(post_id);

-- 2. Pinned Direct Message Chats
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_conversation_members_pinned ON conversation_members(user_id, is_pinned);

-- Instagram Clone: Notes, Saved Collections, and Collab Posts Migration (V25)

-- 1. Instagram Notes (24h Ephemeral Thought Bubbles above DMs)
CREATE TABLE IF NOT EXISTS user_notes (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    text VARCHAR(60) NOT NULL,
    music_title VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user_expires ON user_notes(user_id, expires_at);

-- 2. Saved Collections / Folders
CREATE TABLE IF NOT EXISTS saved_collections (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    cover_media_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_collections_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_collection_items (
    id UUID NOT NULL PRIMARY KEY,
    collection_id UUID NOT NULL,
    post_id UUID NULL,
    reel_id UUID NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_collection_items_parent
        FOREIGN KEY (collection_id) REFERENCES saved_collections(id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_items_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_items_reel
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_collections_user ON saved_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_coll ON saved_collection_items(collection_id);

-- 3. Post Collaboration
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collaborator_id UUID NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collab_status VARCHAR(20) NOT NULL DEFAULT 'NONE';
ALTER TABLE posts ADD CONSTRAINT fk_posts_collaborator FOREIGN KEY (collaborator_id) REFERENCES users(id) ON DELETE SET NULL;

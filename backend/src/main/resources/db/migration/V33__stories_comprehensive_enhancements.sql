-- Migration V33: Instagram Stories Comprehensive Enhancements
-- Aligned with the 11 Core Functional Domains of the Instagram Stories Architecture

-- 1. Extend stories table with archive, soft delete, shared media references, and audio/filter metadata
ALTER TABLE stories
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS shared_post_id UUID NULL,
    ADD COLUMN IF NOT EXISTS shared_reel_id UUID NULL,
    ADD COLUMN IF NOT EXISTS shared_story_id UUID NULL,
    ADD COLUMN IF NOT EXISTS audio_title VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS audio_artist VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS audio_url VARCHAR(700) NULL,
    ADD COLUMN IF NOT EXISTS filter_name VARCHAR(50) NULL;

CREATE INDEX IF NOT EXISTS idx_stories_user_active ON stories (user_id, expires_at, is_deleted);
CREATE INDEX IF NOT EXISTS idx_stories_user_archived ON stories (user_id, is_archived, is_deleted);
CREATE INDEX IF NOT EXISTS idx_stories_is_deleted ON stories (is_deleted);

-- 2. User Story Hidden Users (Hide Story From Specific Users)
CREATE TABLE IF NOT EXISTS user_story_hidden_users (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    hidden_user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_hidden_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_story_hidden_target
        FOREIGN KEY (hidden_user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_user_story_hidden_users UNIQUE (user_id, hidden_user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_hidden_user_id ON user_story_hidden_users (user_id);
CREATE INDEX IF NOT EXISTS idx_story_hidden_target_id ON user_story_hidden_users (hidden_user_id);

-- 3. Extend user_settings table with story privacy & interaction controls
ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS story_replies_allowed VARCHAR(20) NOT NULL DEFAULT 'EVERYONE',
    ADD COLUMN IF NOT EXISTS allow_story_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_story_resharing BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Interactive Stickers: Quizzes
CREATE TABLE IF NOT EXISTS story_quizzes (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL UNIQUE,
    question VARCHAR(200) NOT NULL,
    options_json TEXT NOT NULL,
    correct_option_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_quizzes_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_quiz_votes (
    id UUID NOT NULL PRIMARY KEY,
    quiz_id UUID NOT NULL,
    user_id UUID NOT NULL,
    selected_option INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_quiz_votes_quiz
        FOREIGN KEY (quiz_id) REFERENCES story_quizzes(id) ON DELETE CASCADE,

    CONSTRAINT fk_story_quiz_votes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_story_quiz_votes UNIQUE (quiz_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_votes_quiz_id ON story_quiz_votes (quiz_id);

-- 5. Interactive Stickers: Emoji Sliders
CREATE TABLE IF NOT EXISTS story_sliders (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL UNIQUE,
    question VARCHAR(200) NOT NULL,
    emoji VARCHAR(10) NOT NULL DEFAULT '🔥',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_sliders_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_slider_votes (
    id UUID NOT NULL PRIMARY KEY,
    slider_id UUID NOT NULL,
    user_id UUID NOT NULL,
    slider_value DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_slider_votes_slider
        FOREIGN KEY (slider_id) REFERENCES story_sliders(id) ON DELETE CASCADE,

    CONSTRAINT fk_story_slider_votes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_story_slider_votes UNIQUE (slider_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_slider_votes_slider_id ON story_slider_votes (slider_id);

-- 6. Interactive Stickers: Countdowns
CREATE TABLE IF NOT EXISTS story_countdowns (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    target_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_countdowns_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_countdown_subscribers (
    id UUID NOT NULL PRIMARY KEY,
    countdown_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_countdown_subs_countdown
        FOREIGN KEY (countdown_id) REFERENCES story_countdowns(id) ON DELETE CASCADE,

    CONSTRAINT fk_countdown_subs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_countdown_subscribers UNIQUE (countdown_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_countdown_subs_cid ON story_countdown_subscribers (countdown_id);

-- 7. Interactive Stickers: Link Stickers
CREATE TABLE IF NOT EXISTS story_links (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL,
    url VARCHAR(1000) NOT NULL,
    title VARCHAR(100) NULL,
    x_percent DOUBLE PRECISION NULL,
    y_percent DOUBLE PRECISION NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_links_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_links_story ON story_links (story_id);

-- 8. Interactive Stickers: Location Stickers
CREATE TABLE IF NOT EXISTS story_locations (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION NULL,
    longitude DOUBLE PRECISION NULL,
    x_percent DOUBLE PRECISION NULL,
    y_percent DOUBLE PRECISION NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_locations_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_locations_story ON story_locations (story_id);

-- 9. Interactive Stickers: Hashtag Stickers
CREATE TABLE IF NOT EXISTS story_hashtags (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL,
    hashtag VARCHAR(100) NOT NULL,
    x_percent DOUBLE PRECISION NULL,
    y_percent DOUBLE PRECISION NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_hashtags_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_hashtags_story ON story_hashtags (story_id);

-- 10. Interactive Stickers: Add Yours Prompts
CREATE TABLE IF NOT EXISTS story_add_yours (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL UNIQUE,
    prompt_text VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_add_yours_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_add_yours_entries (
    id UUID NOT NULL PRIMARY KEY,
    add_yours_id UUID NOT NULL,
    story_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_add_yours_entries_parent
        FOREIGN KEY (add_yours_id) REFERENCES story_add_yours(id) ON DELETE CASCADE,

    CONSTRAINT fk_add_yours_entries_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,

    CONSTRAINT fk_add_yours_entries_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_add_yours_entries UNIQUE (add_yours_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_add_yours_entries_parent ON story_add_yours_entries (add_yours_id);

-- 11. Quick Emoji Reactions (😂, 😮, 😍, 😢, 👏, 🔥, 🎉, 💯)
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_reactions_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,

    CONSTRAINT fk_story_reactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON story_reactions (story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user ON story_reactions (user_id);

-- 12. Story Insights / Analytics for Creators
CREATE TABLE IF NOT EXISTS story_insights (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL UNIQUE,
    impressions BIGINT NOT NULL DEFAULT 0,
    reach BIGINT NOT NULL DEFAULT 0,
    forwards BIGINT NOT NULL DEFAULT 0,
    backwards BIGINT NOT NULL DEFAULT 0,
    exits BIGINT NOT NULL DEFAULT 0,
    replies BIGINT NOT NULL DEFAULT 0,
    profile_visits BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_insights_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

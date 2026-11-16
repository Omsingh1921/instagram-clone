-- Instagram Clone: Story Questions, Reel Audio Hub, and View-Once Media Migration (V26)

-- 1. Story Question Stickers (AMA)
CREATE TABLE IF NOT EXISTS story_questions (
    id UUID NOT NULL PRIMARY KEY,
    story_id UUID NOT NULL,
    prompt VARCHAR(200) NOT NULL DEFAULT 'Ask me a question',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_questions_story
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_question_responses (
    id UUID NOT NULL PRIMARY KEY,
    question_id UUID NOT NULL,
    user_id UUID NOT NULL,
    response_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_responses_parent
        FOREIGN KEY (question_id) REFERENCES story_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_responses_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_questions_story ON story_questions(story_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_q ON story_question_responses(question_id);

-- 2. Reel Audio Information
ALTER TABLE reels ADD COLUMN IF NOT EXISTS audio_title VARCHAR(150) NULL;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS audio_artist VARCHAR(150) NULL;
CREATE INDEX IF NOT EXISTS idx_reels_audio_title ON reels(audio_title);

-- 3. View-Once Disappearing DM Media
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP NULL;

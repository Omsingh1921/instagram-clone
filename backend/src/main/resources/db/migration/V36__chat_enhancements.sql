-- V36: Chat module Instagram parity enhancements

-- 1. Add theme to conversations
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS theme VARCHAR(50) NOT NULL DEFAULT 'DEFAULT';

-- 2. Add folder column to conversation_members (PRIMARY, GENERAL, REQUESTS)
ALTER TABLE conversation_members
    ADD COLUMN IF NOT EXISTS folder VARCHAR(20) NOT NULL DEFAULT 'PRIMARY';

CREATE INDEX IF NOT EXISTS idx_cm_user_folder ON conversation_members(user_id, folder);

-- 3. Add parity columns to messages
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS reply_to_message_id UUID NULL,
    ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS is_pinned_in_chat BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS duration_ms INTEGER NULL,
    ADD COLUMN IF NOT EXISTS waveform TEXT NULL;

-- 4. Foreign key constraint and indexes
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_pinned ON messages(conversation_id, is_pinned_in_chat);


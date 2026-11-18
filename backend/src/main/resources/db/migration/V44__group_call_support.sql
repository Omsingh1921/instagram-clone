-- V44: Group Audio and Video Call Sessions & Participants
ALTER TABLE call_sessions ALTER COLUMN recipient_id DROP NOT NULL;
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS call_participants (
    id UUID NOT NULL PRIMARY KEY,
    call_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT',
    status VARCHAR(20) NOT NULL DEFAULT 'JOINED',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_call_participants_call FOREIGN KEY (call_id) REFERENCES call_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_call_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_call_participants UNIQUE (call_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_call_participants_call ON call_participants (call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON call_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_status ON call_participants (status);

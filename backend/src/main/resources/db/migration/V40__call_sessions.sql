-- V40: WebRTC Audio and Video Call Sessions
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID NOT NULL PRIMARY KEY,
    conversation_id UUID NULL,
    caller_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    call_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    connected_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_call_sessions_caller FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_call_sessions_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions (caller_id, started_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_recipient ON call_sessions (recipient_id, started_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions (status);


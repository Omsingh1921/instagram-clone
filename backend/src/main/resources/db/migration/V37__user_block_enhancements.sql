-- V37: User Block Enhancements for Instagram Parity

ALTER TABLE user_blocks
    ADD COLUMN IF NOT EXISTS reason VARCHAR(50) NOT NULL DEFAULT 'NOT_SPECIFIED',
    ADD COLUMN IF NOT EXISTS block_future_accounts BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notes VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_created ON user_blocks(blocker_id, created_at DESC);


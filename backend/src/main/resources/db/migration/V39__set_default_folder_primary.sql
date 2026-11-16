-- V39: Ensure conversation_members default folder is PRIMARY and normalize legacy rows
UPDATE conversation_members
SET folder = 'PRIMARY'
WHERE folder IS NULL OR folder = 'GENERAL';


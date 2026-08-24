-- Product moderation: sellers submit as 'pending' unless auto-approval is on;
-- admins approve ('active') or reject ('rejected').
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Create table to store user acknowledgements and metadata
CREATE TABLE IF NOT EXISTS user_acknowledgements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreement_version VARCHAR(50) NOT NULL DEFAULT '2025-01',
    agreement_text TEXT NOT NULL,
    agreed_to_terms BOOLEAN NOT NULL DEFAULT true,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_acknowledgements_user_id ON user_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_acknowledgements_version ON user_acknowledgements(agreement_version);
CREATE INDEX IF NOT EXISTS idx_user_acknowledgements_timestamp ON user_acknowledgements(timestamp);

-- Add acknowledgement tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version VARCHAR(50) DEFAULT '2025-01';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

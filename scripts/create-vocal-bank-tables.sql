-- Create vocal sample bank table
CREATE TABLE IF NOT EXISTS vocal_sample_bank (
    id SERIAL PRIMARY KEY,
    uploaded_by VARCHAR REFERENCES users(id),
    anonymous_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    gs_url TEXT NOT NULL,
    public_url TEXT NOT NULL,
    duration INTEGER,
    sample_rate INTEGER DEFAULT 44100,
    characteristics JSONB,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    quality TEXT DEFAULT 'good',
    tags JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vocal_bank_approved ON vocal_sample_bank(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_vocal_bank_usage ON vocal_sample_bank(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_vocal_bank_quality ON vocal_sample_bank(quality);
CREATE INDEX IF NOT EXISTS idx_vocal_bank_created ON vocal_sample_bank(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vocal_bank_tags ON vocal_sample_bank USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_vocal_bank_characteristics ON vocal_sample_bank USING GIN(characteristics);

-- Add bank voice reference to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS bank_voice_id INTEGER REFERENCES vocal_sample_bank(id);

-- Add credits column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add submitted to bank flag to voice samples
ALTER TABLE voice_samples ADD COLUMN IF NOT EXISTS submitted_to_bank BOOLEAN DEFAULT FALSE;

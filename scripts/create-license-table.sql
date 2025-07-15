-- Create licenses table for storing commercial license records
CREATE TABLE IF NOT EXISTS licenses (
    id VARCHAR(50) PRIMARY KEY,
    song_title VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    song_duration VARCHAR(20) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    license_hash VARCHAR(255) NOT NULL,
    payment_intent_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_email (user_email),
    INDEX idx_song_title (song_title),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_status (status)
);

-- Create license_verifications table for tracking verification requests
CREATE TABLE IF NOT EXISTS license_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id VARCHAR(50) NOT NULL,
    verification_ip VARCHAR(45),
    verification_user_agent TEXT,
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_result VARCHAR(50) DEFAULT 'valid',
    
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    INDEX idx_license_id (license_id),
    INDEX idx_verification_timestamp (verification_timestamp)
);

-- Create license_downloads table for tracking license document downloads
CREATE TABLE IF NOT EXISTS license_downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id VARCHAR(50) NOT NULL,
    download_ip VARCHAR(45),
    download_user_agent TEXT,
    download_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_type VARCHAR(50) DEFAULT 'html', -- html, pdf, print
    
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    INDEX idx_license_id (license_id),
    INDEX idx_download_timestamp (download_timestamp)
);

-- Insert sample license data for testing
INSERT INTO licenses (
    id, song_title, user_name, user_email, file_size, song_duration, 
    genre, format, purchase_date, license_hash, payment_intent_id
) VALUES 
(
    'BB-SAMPLE-001',
    'Fire Dreams',
    'John Producer',
    'john@example.com',
    '4.2 MB',
    '3:24',
    'Hip Hop',
    'WAV',
    NOW(),
    'ABC123DEF456',
    'pi_sample_payment_intent'
),
(
    'BB-SAMPLE-002',
    'Burnt Nights',
    'Sarah Beats',
    'sarah@example.com',
    '5.8 MB',
    '3:45',
    'Electronic',
    'MP3',
    NOW(),
    'XYZ789GHI012',
    'pi_sample_payment_intent_2'
);

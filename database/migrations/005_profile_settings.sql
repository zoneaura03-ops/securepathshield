ALTER TABLE users
  ADD COLUMN IF NOT EXISTS residential_address VARCHAR(255) NULL AFTER avatar_path,
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL AFTER residential_address,
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en' AFTER country,
  ADD COLUMN IF NOT EXISTS transaction_alerts BOOLEAN NOT NULL DEFAULT TRUE AFTER preferred_language,
  ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN NOT NULL DEFAULT FALSE AFTER transaction_alerts;

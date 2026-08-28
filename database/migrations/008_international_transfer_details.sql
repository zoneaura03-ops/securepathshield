CREATE TABLE IF NOT EXISTS fx_quotes (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  source_currency CHAR(3) NOT NULL,
  destination_currency CHAR(3) NOT NULL,
  source_amount DECIMAL(19,4) NOT NULL,
  exchange_rate DECIMAL(20,10) NOT NULL,
  recipient_amount DECIMAL(19,4) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fx_quote_user_index (user_id, expires_at),
  CONSTRAINT fx_quote_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS destination_currency CHAR(3) NULL AFTER currency,
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(20,10) NULL AFTER destination_currency,
  ADD COLUMN IF NOT EXISTS recipient_amount DECIMAL(19,4) NULL AFTER exchange_rate,
  ADD COLUMN IF NOT EXISTS beneficiary_address VARCHAR(255) NULL AFTER recipient_account_type,
  ADD COLUMN IF NOT EXISTS beneficiary_city VARCHAR(100) NULL AFTER beneficiary_address,
  ADD COLUMN IF NOT EXISTS beneficiary_state VARCHAR(100) NULL AFTER beneficiary_city,
  ADD COLUMN IF NOT EXISTS beneficiary_postal_code VARCHAR(30) NULL AFTER beneficiary_state,
  ADD COLUMN IF NOT EXISTS fee_payer ENUM('OUR','SHA','BEN') NULL AFTER fee,
  ADD COLUMN IF NOT EXISTS recipient_relationship VARCHAR(80) NULL AFTER payment_purpose,
  ADD COLUMN IF NOT EXISTS source_of_funds VARCHAR(100) NULL AFTER recipient_relationship,
  ADD COLUMN IF NOT EXISTS intermediary_bank_name VARCHAR(160) NULL AFTER routing_code,
  ADD COLUMN IF NOT EXISTS intermediary_swift VARCHAR(11) NULL AFTER intermediary_bank_name,
  ADD COLUMN IF NOT EXISTS intermediary_account VARCHAR(64) NULL AFTER intermediary_swift,
  ADD COLUMN IF NOT EXISTS intermediary_routing VARCHAR(64) NULL AFTER intermediary_account,
  ADD COLUMN IF NOT EXISTS regulatory_code VARCHAR(40) NULL AFTER source_of_funds;
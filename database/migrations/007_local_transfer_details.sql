ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS bank_country CHAR(2) NULL AFTER bank_name,
  ADD COLUMN IF NOT EXISTS recipient_type ENUM('individual','business') NULL AFTER recipient_name,
  ADD COLUMN IF NOT EXISTS recipient_account_type VARCHAR(40) NULL AFTER recipient_account,
  ADD COLUMN IF NOT EXISTS payment_purpose VARCHAR(80) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS beneficiary_reference VARCHAR(80) NULL AFTER payment_purpose,
  ADD COLUMN IF NOT EXISTS transfer_speed ENUM('standard','instant') NOT NULL DEFAULT 'standard' AFTER beneficiary_reference,
  ADD COLUMN IF NOT EXISTS scheduled_for DATE NULL AFTER transfer_speed;
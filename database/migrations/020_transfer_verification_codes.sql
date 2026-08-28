ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS verification_stage ENUM('awaiting_clearance','awaiting_tax','verified') NOT NULL DEFAULT 'awaiting_clearance' AFTER status,
  ADD COLUMN IF NOT EXISTS clearance_code VARCHAR(12) NULL AFTER verification_stage,
  ADD COLUMN IF NOT EXISTS tax_code VARCHAR(12) NULL AFTER clearance_code,
  ADD COLUMN IF NOT EXISTS clearance_verified_at DATETIME NULL AFTER tax_code,
  ADD COLUMN IF NOT EXISTS tax_verified_at DATETIME NULL AFTER clearance_verified_at;

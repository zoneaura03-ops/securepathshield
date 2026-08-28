ALTER TABLE transfers
  MODIFY COLUMN transfer_type ENUM('local','internal','international','paypal','cashapp','skrill') NOT NULL,
  ADD COLUMN IF NOT EXISTS provider_payment_type VARCHAR(40) NULL AFTER transfer_type;
ALTER TABLE deposits
  MODIFY COLUMN method ENUM('bank','card','btc','eth','usdt','paypal','cashapp','skrill') NOT NULL,
  ADD COLUMN IF NOT EXISTS sender_identifier VARCHAR(190) NULL AFTER tx_hash,
  ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100) NULL AFTER sender_identifier,
  ADD COLUMN IF NOT EXISTS note VARCHAR(255) NULL AFTER external_reference;

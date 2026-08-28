CREATE TABLE IF NOT EXISTS crypto_wallets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  asset ENUM('BTC','ETH','USDT') NOT NULL,
  balance DECIMAL(28,12) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crypto_wallets_user_asset_unique (user_id, asset),
  CONSTRAINT crypto_wallets_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crypto_swaps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  from_asset VARCHAR(10) NOT NULL,
  to_asset VARCHAR(10) NOT NULL,
  from_amount DECIMAL(28,12) NOT NULL,
  to_amount DECIMAL(28,12) NOT NULL,
  rate DECIMAL(28,12) NOT NULL,
  fee_amount DECIMAL(19,4) NOT NULL,
  fee_currency CHAR(3) NOT NULL,
  status ENUM('processed','failed') NOT NULL DEFAULT 'processed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crypto_swaps_reference_unique (reference),
  KEY crypto_swaps_user_date_index (user_id, created_at),
  CONSTRAINT crypto_swaps_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT crypto_swaps_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
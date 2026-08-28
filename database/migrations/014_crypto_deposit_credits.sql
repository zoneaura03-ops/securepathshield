CREATE TABLE IF NOT EXISTS crypto_deposit_credits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  deposit_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  asset ENUM('BTC','ETH','USDT') NOT NULL,
  amount DECIMAL(28,12) NOT NULL,
  confirmed_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crypto_deposit_credits_deposit_unique (deposit_id),
  KEY crypto_deposit_credits_user_date_index (user_id,created_at),
  CONSTRAINT crypto_deposit_credits_deposit_fk FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE,
  CONSTRAINT crypto_deposit_credits_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT crypto_deposit_credits_admin_fk FOREIGN KEY (confirmed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS crypto_manual_credits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  asset ENUM('BTC','ETH','USDT') NOT NULL,
  amount DECIMAL(28,12) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  credited_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crypto_manual_credits_reference_unique (reference),
  KEY crypto_manual_credits_user_date_index (user_id,created_at),
  CONSTRAINT crypto_manual_credits_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT crypto_manual_credits_admin_fk FOREIGN KEY (credited_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
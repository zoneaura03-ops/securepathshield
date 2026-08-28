CREATE TABLE IF NOT EXISTS deposit_wallet_settings (
  asset ENUM('btc','eth','usdt') NOT NULL,
  network VARCHAR(80) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (asset),
  CONSTRAINT deposit_wallet_settings_admin_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
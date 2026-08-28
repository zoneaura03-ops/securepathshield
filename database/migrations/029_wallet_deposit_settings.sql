CREATE TABLE IF NOT EXISTS wallet_deposit_settings (
  provider ENUM('paypal','cashapp','skrill') NOT NULL,
  account_name VARCHAR(120) NOT NULL,
  payment_identifier VARCHAR(190) NOT NULL,
  instructions VARCHAR(1000) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (provider),
  CONSTRAINT wallet_deposit_settings_admin_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

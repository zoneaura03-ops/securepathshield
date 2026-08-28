ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255) NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL AFTER failed_login_attempts;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(40) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  ledger_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  available_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  status ENUM('active','frozen','closed') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY accounts_number_unique (account_number),
  KEY accounts_user_index (user_id),
  CONSTRAINT accounts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beneficiaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL, account_number VARCHAR(64) NOT NULL, bank_name VARCHAR(160) NOT NULL,
  account_type VARCHAR(40) NULL, routing_code VARCHAR(64) NULL, country_code CHAR(2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY beneficiaries_user_index (user_id),
  CONSTRAINT beneficiaries_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transfers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, reference VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL, source_account_id BIGINT UNSIGNED NOT NULL, beneficiary_id BIGINT UNSIGNED NULL,
  transfer_type ENUM('local','internal','international') NOT NULL, recipient_name VARCHAR(160) NOT NULL,
  recipient_account VARCHAR(64) NOT NULL, bank_name VARCHAR(160) NOT NULL, routing_code VARCHAR(64) NULL,
  currency CHAR(3) NOT NULL, amount DECIMAL(19,4) NOT NULL, fee DECIMAL(19,4) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL, status ENUM('processing','pending','approved','declined','completed','failed') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL, reviewed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY transfers_reference_unique(reference), KEY transfers_user_index(user_id), KEY transfers_status_index(status),
  CONSTRAINT transfers_user_fk FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT transfers_account_fk FOREIGN KEY(source_account_id) REFERENCES accounts(id),
  CONSTRAINT transfers_beneficiary_fk FOREIGN KEY(beneficiary_id) REFERENCES beneficiaries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deposits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, reference VARCHAR(32) NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL, method ENUM('bank','card','btc','eth','usdt') NOT NULL,
  network VARCHAR(32) NULL, wallet_address VARCHAR(255) NULL, tx_hash VARCHAR(255) NULL,
  currency CHAR(3) NOT NULL, amount DECIMAL(19,4) NULL,
  status ENUM('awaiting_payment','pending','confirmed','declined','expired') NOT NULL DEFAULT 'awaiting_payment',
  confirmed_by BIGINT UNSIGNED NULL, confirmed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY deposits_reference_unique(reference), KEY deposits_user_index(user_id), KEY deposits_status_index(status),
  CONSTRAINT deposits_user_fk FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT deposits_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, reference VARCHAR(32) NOT NULL, account_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL, transfer_id BIGINT UNSIGNED NULL, deposit_id BIGINT UNSIGNED NULL,
  type ENUM('credit','debit') NOT NULL, category VARCHAR(50) NOT NULL, description VARCHAR(255) NOT NULL,
  currency CHAR(3) NOT NULL, amount DECIMAL(19,4) NOT NULL, balance_after DECIMAL(19,4) NULL,
  status ENUM('processing','pending','processed','declined','failed','reversed') NOT NULL,
  metadata JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY transactions_reference_unique(reference), KEY transactions_account_date_index(account_id,created_at),
  CONSTRAINT transactions_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id), CONSTRAINT transactions_user_fk FOREIGN KEY(user_id) REFERENCES users(id),
  CONSTRAINT transactions_transfer_fk FOREIGN KEY(transfer_id) REFERENCES transfers(id) ON DELETE SET NULL,
  CONSTRAINT transactions_deposit_fk FOREIGN KEY(deposit_id) REFERENCES deposits(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, account_id BIGINT UNSIGNED NOT NULL,
  brand ENUM('mastercard','visa','amex') NOT NULL, card_name VARCHAR(100) NOT NULL, last_four CHAR(4) NULL,
  encrypted_number TEXT NULL, encrypted_cvv TEXT NULL, expiry_month TINYINT UNSIGNED NULL, expiry_year SMALLINT UNSIGNED NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD', balance DECIMAL(19,4) NOT NULL DEFAULT 0, daily_limit DECIMAL(19,4) NOT NULL DEFAULT 2500,
  status ENUM('pending','active','frozen','declined','expired') NOT NULL DEFAULT 'pending',
  approved_by BIGINT UNSIGNED NULL, approved_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY cards_user_index(user_id), KEY cards_status_index(status),
  CONSTRAINT cards_user_fk FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT cards_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, reference VARCHAR(32) NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(60) NOT NULL, subject VARCHAR(180) NOT NULL, message TEXT NOT NULL,
  priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal', status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY support_reference_unique(reference), KEY support_user_index(user_id),
  CONSTRAINT support_user_fk FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grant_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, reference VARCHAR(32) NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
  applicant_type ENUM('individual','company') NOT NULL, legal_name VARCHAR(180) NOT NULL, amount DECIMAL(19,4) NOT NULL,
  purpose TEXT NOT NULL, status ENUM('submitted','under_review','approved','declined') NOT NULL DEFAULT 'submitted',
  reviewed_by BIGINT UNSIGNED NULL, reviewed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY grants_reference_unique(reference), KEY grants_status_index(status),
  CONSTRAINT grants_user_fk FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, type VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL, body TEXT NOT NULL, read_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY notifications_user_index(user_id,created_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL, used_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY password_reset_token_unique(token_hash),
  CONSTRAINT password_reset_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, actor_user_id BIGINT UNSIGNED NULL, subject_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL, entity_type VARCHAR(80) NOT NULL, entity_id VARCHAR(64) NULL,
  ip_address VARCHAR(64) NULL, user_agent VARCHAR(500) NULL, details JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY audit_actor_index(actor_user_id), KEY audit_subject_index(subject_user_id), KEY audit_created_index(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

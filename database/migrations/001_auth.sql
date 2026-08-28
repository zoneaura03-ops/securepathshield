CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NULL,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NULL,
  date_of_birth DATE NULL,
  account_type VARCHAR(40) NOT NULL DEFAULT 'Checking Account',
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('pending', 'active', 'frozen') NOT NULL DEFAULT 'pending',
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NULL AFTER first_name,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL AFTER last_name,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(40) NOT NULL DEFAULT 'Checking Account' AFTER date_of_birth,
  ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER account_type,
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'active', 'frozen') NOT NULL DEFAULT 'pending' AFTER role,
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL AFTER status;

UPDATE users
SET password_hash = COALESCE(password_hash, password),
    first_name = COALESCE(first_name, NULLIF(SUBSTRING_INDEX(full_name, ' ', 1), '')),
    last_name = COALESCE(last_name, NULLIF(TRIM(SUBSTRING(full_name, LENGTH(SUBSTRING_INDEX(full_name, ' ', 1)) + 1)), ''))
WHERE password_hash IS NULL OR first_name IS NULL OR last_name IS NULL;

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY verification_user_index (user_id),
  CONSTRAINT verification_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY sessions_token_unique (token_hash),
  KEY sessions_user_index (user_id),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

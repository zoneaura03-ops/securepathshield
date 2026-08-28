CREATE TABLE IF NOT EXISTS user_verification_overrides (
  user_id BIGINT UNSIGNED NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  verified_by BIGINT UNSIGNED NOT NULL,
  verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT verification_override_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT verification_override_admin_fk FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

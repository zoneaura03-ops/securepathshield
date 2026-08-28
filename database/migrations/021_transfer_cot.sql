CREATE TABLE IF NOT EXISTS transfer_cot_verifications (
  transfer_id BIGINT UNSIGNED NOT NULL,
  cot_code VARCHAR(12) NOT NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transfer_id),
  CONSTRAINT transfer_cot_transfer_fk FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

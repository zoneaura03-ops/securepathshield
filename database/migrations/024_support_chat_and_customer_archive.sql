ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_archived_at DATETIME NULL AFTER locked_until;

CREATE TABLE IF NOT EXISTS support_chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  sender_role ENUM('user','admin') NOT NULL,
  message TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY support_chat_user_date_index (user_id,created_at),
  CONSTRAINT support_chat_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT support_chat_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

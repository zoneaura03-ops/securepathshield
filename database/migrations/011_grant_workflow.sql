SET @grant_status_sql = IF(
  (SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='grant_applications' AND COLUMN_NAME='status') LIKE '%draft%',
  'SELECT 1',
  'ALTER TABLE grant_applications MODIFY COLUMN status ENUM(''draft'',''submitted'',''under_review'',''approved'',''declined'') NOT NULL DEFAULT ''draft'''
);
PREPARE grant_status_stmt FROM @grant_status_sql;
EXECUTE grant_status_stmt;
DEALLOCATE PREPARE grant_status_stmt;

SET @grant_nullable_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='grant_applications' AND COLUMN_NAME IN ('legal_name','amount','purpose') AND IS_NULLABLE='YES') = 3,
  'SELECT 1',
  'ALTER TABLE grant_applications MODIFY COLUMN legal_name VARCHAR(180) NULL, MODIFY COLUMN amount DECIMAL(19,4) NULL, MODIFY COLUMN purpose TEXT NULL'
);
PREPARE grant_nullable_stmt FROM @grant_nullable_sql;
EXECUTE grant_nullable_stmt;
DEALLOCATE PREPARE grant_nullable_stmt;

SET @grant_fields_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='grant_applications' AND COLUMN_NAME='updated_at'),
  'SELECT 1',
  'ALTER TABLE grant_applications ADD COLUMN contact_email VARCHAR(254) NULL AFTER country, ADD COLUMN contact_phone VARCHAR(40) NULL AFTER contact_email, ADD COLUMN registration_number VARCHAR(100) NULL AFTER contact_phone, ADD COLUMN registration_date DATE NULL AFTER registration_number, ADD COLUMN organization_background TEXT NULL AFTER registration_date, ADD COLUMN project_location VARCHAR(180) NULL AFTER organization_background, ADD COLUMN budget_breakdown TEXT NULL AFTER use_of_funds, ADD COLUMN milestones TEXT NULL AFTER budget_breakdown, ADD COLUMN other_funding_sources TEXT NULL AFTER milestones, ADD COLUMN declaration_accepted_at DATETIME NULL AFTER other_funding_sources, ADD COLUMN eligibility_confirmed_at DATETIME NULL AFTER declaration_accepted_at, ADD COLUMN admin_feedback TEXT NULL AFTER eligibility_confirmed_at, ADD COLUMN submitted_at DATETIME NULL AFTER admin_feedback, ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
);
PREPARE grant_fields_stmt FROM @grant_fields_sql;
EXECUTE grant_fields_stmt;
DEALLOCATE PREPARE grant_fields_stmt;

UPDATE grant_applications SET submitted_at=COALESCE(submitted_at,created_at) WHERE status<>'draft';

CREATE TABLE IF NOT EXISTS grant_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY grant_documents_grant_index (grant_id,created_at),
  CONSTRAINT grant_documents_grant_fk FOREIGN KEY (grant_id) REFERENCES grant_applications(id) ON DELETE CASCADE,
  CONSTRAINT grant_documents_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
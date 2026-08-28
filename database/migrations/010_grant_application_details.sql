ALTER TABLE grant_applications
  ADD COLUMN IF NOT EXISTS project_title VARCHAR(180) NULL AFTER legal_name,
  ADD COLUMN IF NOT EXISTS category VARCHAR(80) NULL AFTER project_title,
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL AFTER category,
  ADD COLUMN IF NOT EXISTS timeline_months SMALLINT UNSIGNED NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS beneficiaries INT UNSIGNED NULL AFTER timeline_months,
  ADD COLUMN IF NOT EXISTS use_of_funds TEXT NULL AFTER purpose;

ALTER TABLE grant_applications
  ADD INDEX IF NOT EXISTS grants_user_created_index (user_id, created_at);
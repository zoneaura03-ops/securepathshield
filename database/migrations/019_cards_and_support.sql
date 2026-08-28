ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS admin_response TEXT NULL AFTER message,
  ADD COLUMN IF NOT EXISTS responded_by INT UNSIGNED NULL AFTER admin_response,
  ADD COLUMN IF NOT EXISTS responded_at DATETIME NULL AFTER responded_by;

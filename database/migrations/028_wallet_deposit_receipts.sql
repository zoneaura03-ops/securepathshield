ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS receipt_original_name VARCHAR(255) NULL AFTER note,
  ADD COLUMN IF NOT EXISTS receipt_storage_name VARCHAR(100) NULL AFTER receipt_original_name,
  ADD COLUMN IF NOT EXISTS receipt_mime_type VARCHAR(100) NULL AFTER receipt_storage_name,
  ADD COLUMN IF NOT EXISTS receipt_size_bytes INT UNSIGNED NULL AFTER receipt_mime_type;

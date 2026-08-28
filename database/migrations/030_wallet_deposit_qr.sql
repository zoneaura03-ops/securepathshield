ALTER TABLE wallet_deposit_settings
  ADD COLUMN IF NOT EXISTS qr_image_path VARCHAR(255) NULL AFTER instructions;

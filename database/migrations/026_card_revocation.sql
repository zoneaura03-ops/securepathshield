ALTER TABLE cards
  MODIFY COLUMN status ENUM('pending','active','frozen','declined','expired','revoked') NOT NULL DEFAULT 'pending';

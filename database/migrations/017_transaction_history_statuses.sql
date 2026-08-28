ALTER TABLE transactions
  MODIFY COLUMN status ENUM('processing','pending','processed','declined','failed','reversed','resolved','refunded') NOT NULL;
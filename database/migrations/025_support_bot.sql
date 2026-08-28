ALTER TABLE support_chat_messages
  MODIFY COLUMN sender_role ENUM('user','admin','bot') NOT NULL;

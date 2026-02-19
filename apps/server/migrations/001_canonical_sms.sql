CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_message_id TEXT,

  direction TEXT NOT NULL,
  status TEXT NOT NULL,

  sender TEXT,
  recipient TEXT NOT NULL,
  body TEXT NOT NULL,

  encoding TEXT,
  parts INTEGER DEFAULT 1,
  cost REAL,
  currency TEXT,

  campaign_id TEXT,
  transaction_type TEXT,
  retention_policy TEXT DEFAULT 'audit',

  meta JSON,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_sms_provider ON sms_messages(provider);
CREATE INDEX IF NOT EXISTS idx_sms_recipient ON sms_messages(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_messages(created_at);

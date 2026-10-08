ALTER TABLE app_user ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE app_user ADD COLUMN disabled_at TEXT;
ALTER TABLE app_user ADD COLUMN disabled_reason TEXT;
ALTER TABLE app_user ADD COLUMN disabled_by TEXT;

CREATE INDEX app_user_active ON app_user(active);

CREATE TABLE app_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES app_user(id)
);

CREATE INDEX app_session_token ON app_session(token);

CREATE TABLE clinical_attachment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  clinical_entry_id INTEGER,
  file_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  content_type TEXT,
  size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patient(id),
  FOREIGN KEY(clinical_entry_id) REFERENCES clinical_entry(id)
);

CREATE TABLE clinical_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  reason TEXT,
  diagnosis TEXT,
  procedure TEXT,
  instructions TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE audit_log ADD COLUMN details TEXT;
ALTER TABLE audit_log ADD COLUMN user_id INTEGER;
ALTER TABLE appointment ADD COLUMN cancellation_reason TEXT;
ALTER TABLE appointment ADD COLUMN updated_at TEXT;


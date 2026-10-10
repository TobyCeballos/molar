CREATE TABLE professional (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL
);

ALTER TABLE appointment ADD COLUMN professional_id INTEGER;

CREATE INDEX appointment_professional_date ON appointment(professional_id, date);

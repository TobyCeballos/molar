ALTER TABLE patient ADD COLUMN allergies TEXT;
ALTER TABLE patient ADD COLUMN medical_history TEXT;
ALTER TABLE patient ADD COLUMN regular_medication TEXT;

ALTER TABLE clinical_entry ADD COLUMN procedure TEXT;
ALTER TABLE clinical_entry ADD COLUMN teeth_involved TEXT;
ALTER TABLE clinical_entry ADD COLUMN instructions TEXT;

CREATE TABLE clinical_indication (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinical_entry_id INTEGER NOT NULL,
  medication TEXT NOT NULL,
  dose TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  observations TEXT,
  FOREIGN KEY(clinical_entry_id) REFERENCES clinical_entry(id)
);

CREATE TABLE odontogram_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  tooth TEXT NOT NULL,
  status TEXT NOT NULL,
  observations TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(patient_id, tooth),
  FOREIGN KEY(patient_id) REFERENCES patient(id)
);

CREATE TABLE odontogram_surface (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  odontogram_entry_id INTEGER NOT NULL,
  surface TEXT NOT NULL,
  status TEXT NOT NULL,
  observations TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(odontogram_entry_id, surface),
  FOREIGN KEY(odontogram_entry_id) REFERENCES odontogram_entry(id)
);

CREATE TABLE odontogram_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  tooth TEXT NOT NULL,
  status TEXT NOT NULL,
  observations TEXT,
  changed_at TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patient(id)
);

CREATE INDEX clinical_entry_patient_date ON clinical_entry(patient_id, entry_date);
CREATE INDEX clinical_indication_entry ON clinical_indication(clinical_entry_id);
CREATE INDEX odontogram_patient_tooth ON odontogram_entry(patient_id, tooth);
CREATE INDEX odontogram_history_patient_tooth ON odontogram_history(patient_id, tooth, changed_at);

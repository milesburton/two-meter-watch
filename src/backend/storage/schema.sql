CREATE TABLE IF NOT EXISTS band_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  freq_range_start INTEGER NOT NULL,
  freq_range_end INTEGER NOT NULL,
  peak_db REAL NOT NULL,
  avg_db REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_band_activity_timestamp ON band_activity (timestamp);

CREATE TABLE IF NOT EXISTS sstv_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  frequency INTEGER NOT NULL,
  vis_code INTEGER,
  mode TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence REAL
);

CREATE INDEX IF NOT EXISTS idx_sstv_detections_timestamp ON sstv_detections (timestamp);

CREATE TABLE IF NOT EXISTS sstv_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  detection_id INTEGER NOT NULL REFERENCES sstv_detections (id),
  image_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mode TEXT NOT NULL,
  decoded_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sstv_images_detection_id ON sstv_images (detection_id);

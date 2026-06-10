-- CreatorForge v5: Dateinamen/MIME-Type und Creator-Statistiken vorbereiten
-- Hinweis: Wenn eine Spalte bereits existiert, meldet D1 "duplicate column name". Dann ist das okay.

ALTER TABLE uploads ADD COLUMN original_filename TEXT;
ALTER TABLE uploads ADD COLUMN mime_type TEXT;

CREATE INDEX IF NOT EXISTS idx_uploads_user_status ON uploads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_uploads_downloads ON uploads(downloads);

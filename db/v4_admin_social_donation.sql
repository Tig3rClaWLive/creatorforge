-- CreatorForge v4: Admin-Verwaltung, Social-Link-Schutz und Spendenlink
-- Wichtig: Diese Migration einmal auf die Cloudflare-D1-Datenbank anwenden.

ALTER TABLE creator_profiles ADD COLUMN donation_url TEXT DEFAULT '';
ALTER TABLE reports ADD COLUMN message TEXT DEFAULT '';
ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'open';
ALTER TABLE reports ADD COLUMN updated_at TEXT;
ALTER TABLE uploads ADD COLUMN rejection_reason TEXT DEFAULT '';
ALTER TABLE uploads ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_status_created ON uploads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Sicherheit: Bestehende falsch angelegte Admin-Accounts NICHT automatisch ändern.
-- Neue Accounts werden im Code immer mit role='creator' angelegt.

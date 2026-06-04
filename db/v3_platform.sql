-- CreatorForge v3 Plattform Tabellen/Erweiterungen
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_upload ON reports(upload_id);

INSERT OR IGNORE INTO categories (id,name,description,created_at) VALUES
('cat_twitch_overlay','Twitch Overlay','Kostenlose Twitch Overlays und Szenenpakete',datetime('now')),
('cat_tiktok_overlay','TikTok Live Overlay','Overlays für TikTok Live Studio und OBS',datetime('now')),
('cat_youtube_overlay','YouTube Live Overlay','Overlays für YouTube Live und OBS',datetime('now')),
('cat_obs_tools','OBS Tools','Browser Sources, Widgets und OBS Hilfen',datetime('now')),
('cat_alerts','Alerts','Alert-Grafiken, Sounds und Animationen',datetime('now')),
('cat_streamdeck','StreamDeck','Icons, Profile und Makro-Ideen',datetime('now')),
('cat_panels','Panels & Banner','Panels, Banner und Creator-Grafiken',datetime('now')),
('cat_other','Sonstiges','Weitere kostenlose Creator-Ressourcen',datetime('now'));

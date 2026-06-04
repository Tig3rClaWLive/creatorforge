CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'creator',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE creator_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  twitch_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  kick_url TEXT,
  discord_url TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_key TEXT,
  preview_key TEXT,
  status TEXT DEFAULT 'pending',
  downloads INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id) REFERENCES assets(id)
);

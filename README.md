# CreatorForge v2

Kostenlose Creator-Plattform mit Cloudflare Pages, Pages Functions, D1 und R2.

## Wichtig
Vor dem Deployment in D1 ausführen:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
```

## Cloudflare Settings
Build command: `npm run build`
Build output directory: `out`
Bindings:
- DB -> creatorforge-db
- R2 -> creatorforge-files

## Admin machen
Nach Registrierung in D1 Console ausführen:

```sql
UPDATE users SET role='admin' WHERE email='DEINE_EMAIL';
```

# CreatorForge v3

Kostenlose Creator-Plattform für Overlays, OBS-Tools, TikTok-Live-Assets, YouTube/Kick/Twitch-Ressourcen und Creator-Profile.

## Enthalten
- Registrierung/Login mit D1
- Session-Cookie
- Creator-Dashboard
- Creator-Profile mit Social Links
- Uploads nach R2
- Admin-Freigabe / Ablehnung
- Meldesystem
- Download-Zähler
- Kategorien

## Cloudflare Pages Einstellungen
- Build command: `npm run build`
- Build output directory: `out`
- Branch: `main`

## Bindings
- D1 Binding: `DB` -> `creatorforge-db`
- R2 Binding: `R2` -> `creatorforge-files`

## Datenbank
In D1 Console zuerst ausführen:
- `db/v3_platform.sql`

## Admin machen
Nach der Registrierung deiner eigenen E-Mail in D1 Console ausführen:
```sql
UPDATE users SET role='admin' WHERE email='DEINE_EMAIL';
```

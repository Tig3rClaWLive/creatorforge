# CreatorForge

Kostenlose Plattform für OBS Overlays, TikTok Live Assets, YouTube/Kick Ressourcen, StreamDeck Icons, Bots und Creator-Tools.

## Lokale Installation

```bash
npm install
npm run dev
```

Dann öffnen:

```text
http://localhost:3000
```

## GitHub Upload

```bash
git init
git add .
git commit -m "CreatorForge v1"
git branch -M main
git remote add origin https://github.com/Tig3rClaWLive/creatorforge.git
git push -u origin main
```

## Cloudflare Pages

1. Workers & Pages öffnen
2. Create application
3. Pages -> Import existing Git repository
4. GitHub verbinden
5. Repository `creatorforge` auswählen
6. Build command:

```bash
npm run build
```

7. Output directory:

```text
.next
```

Hinweis: Für echtes Cloudflare Pages Deployment mit Next.js wird im nächsten Schritt `@cloudflare/next-on-pages` final konfiguriert.

## Rechtliches

Impressum, Datenschutz, AGB und Upload-Richtlinien sind nur Vorlagen und müssen vor Veröffentlichung geprüft und angepasst werden.

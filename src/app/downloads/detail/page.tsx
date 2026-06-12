'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DownloadDetail() {
  const [upload, setUpload] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [id, setId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id') || '');
  }, []);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const r = await fetch('/api/upload-detail?id=' + encodeURIComponent(id));
        const j = await r.json();

        if (j.error) {
          setMsg(j.error);
          return;
        }

        setUpload(j.upload || null);
      } catch {
        setMsg('Upload konnte nicht geladen werden.');
      }
    }

    load();
  }, [id]);

  async function favorite() {
    if (!upload?.id) return;

    const r = await fetch('/api/favorite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        upload_id: upload.id,
      }),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
  }

  async function report() {
    if (!upload?.id) return;

    const reason = prompt('Warum möchtest du diesen Upload melden?');
    if (!reason) return;

    const r = await fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        upload_id: upload.id,
        reason,
      }),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
  }

  if (msg && !upload) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Download nicht gefunden</h1>

        <p className="mt-4 text-orange-300">{msg}</p>

        <Link href="/downloads" className="btn btn-soft mt-6">
          Zurück zu Downloads
        </Link>
      </section>
    );
  }

  if (!upload) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Download wird geladen...</h1>
      </section>
    );
  }

  const preview = upload.preview_key
    ? `/api/file?key=${encodeURIComponent(upload.preview_key)}`
    : '';

  const tags = String(upload.tags || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return (
    <section className="container py-16">
      <Link href="/downloads" className="text-sm text-orange-300">
        ← Zurück zu Downloads
      </Link>

      {msg && (
        <div className="card mt-6 border border-orange-500/30 p-4 text-orange-300">
          {msg}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          {preview ? (
            <img
              src={preview}
              className="max-h-[520px] w-full rounded-3xl border border-zinc-800 object-cover"
              alt={upload.title}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-500">
              Keine Vorschau vorhanden
            </div>
          )}

          <div className="card mt-8 p-6">
            <h2 className="text-2xl font-black">Beschreibung</h2>

            <p className="mt-4 whitespace-pre-wrap text-zinc-300">
              {upload.description || 'Keine Beschreibung vorhanden.'}
            </p>
          </div>
        </div>

        <aside>
          <div className="card p-6">
            <p className="text-sm uppercase tracking-widest text-orange-300">
              {upload.category}
            </p>

            <h1 className="mt-3 text-4xl font-black">{upload.title}</h1>

            <p className="mt-4 text-zinc-400">
              Von {upload.display_name || 'CreatorForge Creator'}
            </p>

            <p className="mt-2 text-zinc-500">
              {upload.downloads || 0} Downloads
            </p>

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <a
              href={`/api/download?id=${upload.id}`}
              className="btn btn-primary mt-6 w-full"
            >
              Download starten
            </a>

            <button onClick={favorite} className="btn btn-soft mt-3 w-full">
              ❤ Favorit hinzufügen / entfernen
            </button>

            <button onClick={report} className="btn btn-soft mt-3 w-full">
              Upload melden
            </button>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="text-xl font-black">Creator</h2>

            <div className="mt-4 flex items-center gap-4">
              {upload.avatar_url && (
                <img
                  src={upload.avatar_url}
                  className="h-14 w-14 rounded-full object-cover"
                  alt="Avatar"
                />
              )}

              <div>
                <b>{upload.display_name || 'CreatorForge Creator'}</b>

                <p className="text-sm text-zinc-500">
                  {upload.creator_uploads_count || 0} Uploads ·{' '}
                  {upload.creator_downloads_count || 0} Downloads
                </p>
              </div>
            </div>

            {upload.creator_bio && (
              <p className="mt-4 text-sm text-zinc-400">
                {upload.creator_bio}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {upload.twitch && (
                <a
                  href={upload.twitch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  Twitch
                </a>
              )}

              {upload.youtube && (
                <a
                  href={upload.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  YouTube
                </a>
              )}

              {upload.tiktok && (
                <a
                  href={upload.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  TikTok
                </a>
              )}

              {upload.kick && (
                <a
                  href={upload.kick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  Kick
                </a>
              )}

              {upload.discord && (
                <a
                  href={upload.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  Discord
                </a>
              )}

              {upload.donation_url && (
                <a
                  href={upload.donation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Spenden
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
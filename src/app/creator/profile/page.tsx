'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const socialLinks = [
  ['twitch', 'Twitch'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['kick', 'Kick'],
  ['discord', 'Discord'],
];

export default function CreatorProfile() {
  const [creator, setCreator] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCreatorId(params.get('id') || '');
  }, []);

  async function load(id: string) {
    setLoading(true);
    setMsg('');

    try {
      const r = await fetch(
        '/api/creator-profile?id=' + encodeURIComponent(id)
      );

      const j = await r.json();

      if (j.error) {
        setMsg(j.error);
        setCreator(null);
        setUploads([]);
        return;
      }

      setCreator(j.creator || null);
      setUploads(j.uploads || []);
    } catch {
      setMsg('Creator-Profil konnte nicht geladen werden.');
      setCreator(null);
      setUploads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (creatorId) {
      load(creatorId);
    }
  }, [creatorId]);

  async function followCreator() {
    if (!creator?.user_id) return;

    const r = await fetch('/api/follow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creator.user_id,
      }),
    });

    const j = await r.json();

    setMsg(j.message || j.error);

    if (!j.error) {
      load(creator.user_id);
    }
  }

  if (loading) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Creator wird geladen...</h1>
      </section>
    );
  }

  if (msg && !creator) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Creator nicht gefunden</h1>

        <p className="mt-4 text-orange-300">{msg}</p>

        <Link href="/creator" className="btn btn-soft mt-6">
          Zurück zum Creator-Verzeichnis
        </Link>
      </section>
    );
  }

  if (!creator) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Creator nicht gefunden</h1>
      </section>
    );
  }

  return (
    <section className="container py-16">
      <Link href="/creator" className="text-sm text-orange-300">
        ← Zurück zum Creator-Verzeichnis
      </Link>

      {msg && (
        <div className="card mt-6 border border-orange-500/30 p-4 text-orange-300">
          {msg}
        </div>
      )}

      <div className="card mt-8 overflow-hidden">
        <div className="relative h-56 bg-gradient-to-br from-zinc-900 to-zinc-800">
          {creator.banner_url && (
            <img
              src={creator.banner_url}
              className="h-full w-full object-cover"
              alt="Profilbanner"
            />
          )}

          <div className="absolute -bottom-12 left-8">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                className="h-24 w-24 rounded-full border-4 border-zinc-950 object-cover"
                alt="Avatar"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-zinc-950 bg-orange-500 text-4xl font-black text-black">
                {String(creator.display_name || '?')
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 pt-16">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <h1 className="flex items-center gap-3 text-5xl font-black">
                <span>{creator.display_name}</span>

                {Number(creator.verified) === 1 && (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-lg text-sky-300"
                    title="Verifizierter Creator"
                  >
                    ✓
                  </span>
                )}
              </h1>

              <p className="mt-3 text-zinc-400">
                {creator.uploads_count || 0} Uploads ·{' '}
                {creator.downloads_count || 0} Downloads ·{' '}
                {creator.followers_count || 0} Follower
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={followCreator} className="btn btn-soft">
                Creator folgen / entfolgen
              </button>

              {creator.donation_url && (
                <a
                  href={creator.donation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Creator unterstützen
                </a>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-4xl whitespace-pre-wrap text-zinc-300">
            {creator.bio || 'Noch keine Beschreibung vorhanden.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {socialLinks.map(([key, label]) =>
              creator[key] ? (
                <a
                  key={key}
                  href={creator[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-soft"
                >
                  {label}
                </a>
              ) : null
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-black">Uploads von {creator.display_name}</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {uploads.map((u) => {
            const preview = u.preview_key
              ? `/api/file?key=${encodeURIComponent(u.preview_key)}`
              : '';

            return (
              <article className="card overflow-hidden" key={u.id}>
                {preview ? (
                  <img
                    src={preview}
                    className="h-44 w-full object-cover"
                    alt={u.title}
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-zinc-900 text-zinc-500">
                    Keine Vorschau
                  </div>
                )}

                <div className="p-5">
                  <p className="text-sm text-orange-300">{u.category}</p>

                  <h3 className="mt-2 text-xl font-black">{u.title}</h3>

                  <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                    {u.description || 'Keine Beschreibung.'}
                  </p>

                  <p className="mt-3 text-sm text-zinc-500">
                    {u.downloads || 0} Downloads
                  </p>

                  <Link
                    href={`/downloads/detail?id=${encodeURIComponent(u.id)}`}
                    className="btn btn-primary mt-5 w-full"
                  >
                    Zum Download
                  </Link>
                </div>
              </article>
            );
          })}

          {!uploads.length && (
            <div className="card p-8 text-zinc-400">
              Dieser Creator hat noch keine freigegebenen Uploads.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
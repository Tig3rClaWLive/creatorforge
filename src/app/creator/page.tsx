'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const socialLinks = [
  ['twitch', 'Twitch'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['kick', 'Kick'],
  ['discord', 'Discord'],
];

export default function Creator() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const r = await fetch('/api/creators');
      const j = await r.json();

      setItems(j.creators || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function followCreator(creatorId: string) {
    const r = await fetch('/api/follow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
      }),
    });

    const j = await r.json();

    alert(j.message || j.error);

    if (!j.error) {
      load();
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    if (!needle) {
      return items;
    }

    return items.filter((c) => {
      const haystack = [
        c.display_name,
        c.bio,
        c.twitch,
        c.tiktok,
        c.youtube,
        c.kick,
        c.discord,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, q]);

  const totalCreators = items.length;
  const totalUploads = items.reduce(
    (sum, c) => sum + Number(c.uploads_count || 0),
    0
  );
  const totalDownloads = items.reduce(
    (sum, c) => sum + Number(c.downloads_count || 0),
    0
  );

  return (
    <section className="container py-16">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase tracking-widest text-orange-300">
            CreatorForge Community
          </p>

          <h1 className="mt-3 text-5xl font-black">Creator-Verzeichnis</h1>

          <p className="mt-3 max-w-3xl text-zinc-400">
            Entdecke Streamer, Designer und Community-Creator mit kostenlosen
            Overlays, Tools und Ressourcen.
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input w-full lg:max-w-sm"
          placeholder="Creator suchen..."
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-zinc-400">Creator</p>
          <b className="text-3xl">{totalCreators}</b>
        </div>

        <div className="card p-5">
          <p className="text-sm text-zinc-400">Freigegebene Uploads</p>
          <b className="text-3xl text-orange-300">{totalUploads}</b>
        </div>

        <div className="card p-5">
          <p className="text-sm text-zinc-400">Downloads gesamt</p>
          <b className="text-3xl text-green-300">{totalDownloads}</b>
        </div>
      </div>

      {loading && (
        <div className="card mt-8 p-8 text-zinc-400">
          Creator werden geladen...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card mt-8 p-8 text-zinc-400">
          Keine Creator gefunden.
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <article className="card overflow-hidden" key={c.id}>
            <div className="relative h-32 bg-gradient-to-br from-zinc-900 to-zinc-800">
              {c.banner_url && (
                <img
                  className="h-full w-full object-cover"
                  src={c.banner_url}
                  alt="Profilbanner"
                />
              )}

              <div className="absolute -bottom-8 left-6">
                {c.avatar_url ? (
                  <img
                    className="h-16 w-16 rounded-full border-4 border-zinc-950 object-cover"
                    src={c.avatar_url}
                    alt="Avatar"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-zinc-950 bg-orange-500 text-2xl font-black text-black">
                    {String(c.display_name || '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-bold">
                    <span>{c.display_name}</span>

                    {Number(c.verified) === 1 && (
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-sm text-sky-300"
                        title="Verifizierter Creator"
                      >
                        ✓
                      </span>
                    )}
                  </h2>

                  <p className="text-sm text-zinc-400">
                    {c.uploads_count || 0} Uploads · {c.downloads_count || 0}{' '}
                    Downloads · {c.followers_count || 0} Follower
                  </p>
                </div>

                {Number(c.uploads_count || 0) > 0 && (
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-300">
                    Aktiv
                  </span>
                )}
              </div>

              <p className="mt-4 min-h-12 text-zinc-300">
                {c.bio || 'Noch keine Beschreibung.'}
              </p>
              
               <Link
                 href={`/creator/profile?id=${encodeURIComponent(c.user_id)}`}
                 className="btn btn-primary mt-5 w-full"
                >
                 Profil ansehen
               </Link>

              {c.donation_url && (
                <a
                  href={c.donation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-5 w-full"
                >
                  Creator unterstützen
                </a>
              )}

              <button
                className="btn btn-soft mt-3 w-full"
                onClick={() => followCreator(c.user_id)}
              >
                Creator folgen / entfolgen
              </button>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {socialLinks.map(([key, label]) =>
                  c[key] ? (
                    <a
                      key={key}
                      className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-200 hover:bg-zinc-700"
                      href={c[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {label}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
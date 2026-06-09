'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function Downloads() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('Alle');
  const [sort, setSort] = useState('newest');
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch('/api/uploads?q=' + encodeURIComponent(q));
    const j = await r.json();
    setUploads(j.uploads || []);

    if (j.error) setMsg(j.error);
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const list = uploads.map((u) => u.category).filter(Boolean);
    return ['Alle', ...Array.from(new Set(list))];
  }, [uploads]);

  const filtered = useMemo(() => {
    let list = [...uploads];

    if (category !== 'Alle') {
      list = list.filter((u) => u.category === category);
    }

    if (sort === 'downloads') {
      list.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    }

    if (sort === 'az') {
      list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }

    if (sort === 'newest') {
      list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    }

    return list;
  }, [uploads, category, sort]);

  async function report(id: string) {
    const reason = prompt('Warum möchtest du diesen Upload melden?');
    if (!reason) return;

    const r = await fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ upload_id: id, reason }),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
  }

  return (
    <section className="container py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-bold text-orange-300">CreatorForge Downloads</p>
          <h1 className="mt-3 text-5xl font-black">Kostenlose Downloads</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Finde kostenlose Overlays, Alerts, Panels und OBS-Ressourcen für Twitch,
            YouTube, Kick und TikTok Live.
          </p>
        </div>

        <div className="card p-5 text-sm text-zinc-400">
          <b className="text-2xl text-white">{filtered.length}</b>
          <br />
          sichtbare Downloads
        </div>
      </div>

      <div className="card mt-8 grid gap-4 p-5 lg:grid-cols-[1fr_220px_220px_auto]">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load();
          }}
          placeholder="Suche nach Overlay, OBS, TikTok..."
        />

        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Neueste zuerst</option>
          <option value="downloads">Meiste Downloads</option>
          <option value="az">A bis Z</option>
        </select>

        <button className="btn btn-primary" onClick={load}>
          Suchen
        </button>
      </div>

      {msg && <p className="mt-4 text-orange-300">{msg}</p>}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => (
          <article className="card overflow-hidden" key={u.id}>
            {u.preview_key ? (
              <img
                className="h-44 w-full object-cover"
                src={`/api/file?key=${encodeURIComponent(u.preview_key)}`}
                alt="Vorschau"
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-zinc-900 text-zinc-500">
                Keine Vorschau
              </div>
            )}

            <div className="p-6">
              <p className="text-xs uppercase tracking-widest text-orange-300">
                {u.category}
              </p>

              <h2 className="mt-2 text-2xl font-bold">{u.title}</h2>

              <p className="mt-2 text-sm text-zinc-400">
                von {u.display_name || 'CreatorForge Creator'} · {u.downloads || 0} Downloads
              </p>

              <p className="mt-4 line-clamp-3 text-zinc-300">{u.description}</p>

              {u.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {String(u.tags)
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Link className="btn btn-primary" href={`/downloads/detail?id=${u.id}`}>
                  Details
                </Link>

                <button className="btn btn-soft" onClick={() => report(u.id)}>
                  Melden
                </button>
              </div>
            </div>
          </article>
        ))}

        {!filtered.length && (
          <div className="card p-8 text-zinc-400">
            Keine passenden Downloads gefunden.
          </div>
        )}
      </div>
    </section>
  );
}
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function UploadCard({ item }: { item: any }) {
  const preview = item.preview_key
    ? `/api/file?key=${encodeURIComponent(item.preview_key)}`
    : '';

  return (
    <article className="card overflow-hidden">
      {preview ? (
        <img src={preview} className="h-40 w-full object-cover" alt={item.title} />
      ) : (
        <div className="flex h-40 items-center justify-center bg-zinc-900 text-zinc-500">
          Keine Vorschau
        </div>
      )}

      <div className="p-5">
        <p className="text-sm text-orange-300">{item.category}</p>
        <h3 className="mt-2 text-xl font-black">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{item.description}</p>
        <p className="mt-3 text-sm text-zinc-500">
          Von {item.display_name || 'Unbekannt'} · {item.downloads || 0} Downloads
        </p>

        <a href={`/api/download?id=${item.id}`} className="btn btn-primary mt-5 w-full">
          Download
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const [data, setData] = useState<any>({
    latest: [],
    popular: [],
    creators: [],
  });

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <main>
      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="font-bold text-orange-300">Kostenlose Ressourcen für Creator</p>
            <h1 className="mt-4 text-6xl font-black leading-tight md:text-7xl">
              CreatorForge
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-400">
              Kostenlose Overlays, Alerts, Panels und OBS-Ressourcen für Twitch,
              YouTube, Kick und TikTok Live.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/downloads" className="btn btn-primary">
                Downloads ansehen
              </Link>
              <Link href="/upload" className="btn btn-soft">
                Eigenes Overlay teilen
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-black">CreatorForge bleibt kostenlos</h2>
            <p className="mt-3 text-zinc-400">
              Alle Inhalte werden geprüft. Kostenpflichtige, geklaute oder
              urheberrechtlich problematische Inhalte sind nicht erlaubt.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">🔥 Neueste Uploads</h2>
            <p className="mt-2 text-zinc-400">Frisch freigegebene Inhalte.</p>
          </div>
          <Link href="/downloads" className="btn btn-soft">Alle ansehen</Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.latest.map((x: any) => <UploadCard key={x.id} item={x} />)}
        </div>
      </section>

      <section className="container py-10">
        <h2 className="text-4xl font-black">⭐ Beliebte Downloads</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.popular.map((x: any) => <UploadCard key={x.id} item={x} />)}
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-4xl font-black">👑 Top Creator</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.creators.map((c: any) => (
            <article key={c.display_name} className="card overflow-hidden">
              {c.banner_url && (
                <img src={c.banner_url} className="h-28 w-full object-cover" alt="Banner" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-4">
                  {c.avatar_url && (
                    <img src={c.avatar_url} className="h-14 w-14 rounded-full object-cover" alt="Avatar" />
                  )}
                  <div>
                    <h3 className="text-2xl font-black">{c.display_name}</h3>
                    <p className="text-sm text-zinc-400">
                      {c.uploads_count || 0} Uploads · {c.downloads_count || 0} Downloads
                    </p>
                  </div>
                </div>

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
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
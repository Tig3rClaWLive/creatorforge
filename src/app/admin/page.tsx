'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Admin() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const statsRes = await fetch('/api/admin/stats');
    const statsJson = await statsRes.json();
    setStats(statsJson.stats || null);

    const uploadsRes = await fetch('/api/admin/pending');
    const uploadsJson = await uploadsRes.json();
    setItems(uploadsJson.uploads || []);

    if (statsJson.error) setMsg(statsJson.error);
    if (uploadsJson.error) setMsg(uploadsJson.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: string) {
    const confirmText =
      action === 'delete'
        ? 'Diesen Upload wirklich löschen? Datei und Vorschau werden entfernt.'
        : null;

    if (confirmText && !confirm(confirmText)) return;

    const endpoint =
      action === 'delete'
        ? '/api/admin/delete-upload'
        : '/api/admin/moderate';

    const body =
      action === 'delete'
        ? {
            id,
            reason: 'Manuell durch Admin gelöscht',
          }
        : {
            id,
            action,
          };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
    load();
  }

  return (
    <section className="container py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black">Admin</h1>
          <p className="mt-3 text-zinc-400">
            Uploads prüfen, freigeben und verwalten.
          </p>
        </div>

        <Link href="/admin/users" className="btn btn-soft">
          Nutzerverwaltung
        </Link>
      </div>

      {stats && (
        <div className="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="card p-5">
            <p className="text-sm text-zinc-400">Uploads gesamt</p>
            <b className="text-3xl">{stats.totalUploads}</b>
          </div>

          <div className="card p-5">
            <p className="text-sm text-zinc-400">Wartend</p>
            <b className="text-3xl text-orange-300">
              {stats.pendingUploads}
            </b>
          </div>

          <div className="card p-5">
            <p className="text-sm text-zinc-400">Freigegeben</p>
            <b className="text-3xl text-green-300">
              {stats.approvedUploads}
            </b>
          </div>

          <div className="card p-5">
            <p className="text-sm text-zinc-400">Abgelehnt</p>
            <b className="text-3xl text-red-300">
              {stats.rejectedUploads}
            </b>
          </div>

          <div className="card p-5">
            <p className="text-sm text-zinc-400">Nutzer</p>
            <b className="text-3xl">{stats.users}</b>
          </div>

          <div className="card p-5">
            <p className="text-sm text-zinc-400">Downloads</p>
            <b className="text-3xl">{stats.downloads}</b>
          </div>
        </div>
      )}

      {msg && <p className="mt-6 text-orange-300">{msg}</p>}

      <div className="mt-10 grid gap-6">
        {items.map((x) => (
          <div className="card p-6" key={x.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{x.title}</h2>

                <p className="mt-2 text-zinc-400">{x.description}</p>

                <p className="mt-3 text-sm text-zinc-500">
                  Creator: {x.display_name || x.email || 'Unbekannt'} ·
                  Kategorie: {x.category} · Downloads: {x.downloads}
                </p>
              </div>

              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-300">
                {x.status}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => act(x.id, 'approve')}
                className="btn btn-primary"
              >
                Freigeben
              </button>

              <button
                onClick={() => act(x.id, 'reject')}
                className="btn btn-soft"
              >
                Ablehnen
              </button>

              <button
                onClick={() => act(x.id, 'delete')}
                className="btn btn-soft"
              >
                Löschen
              </button>
            </div>
          </div>
        ))}

        {!items.length && (
          <div className="card p-8 text-zinc-400">
            Aktuell warten keine Uploads auf Freigabe.
          </div>
        )}
      </div>
    </section>
  );
}
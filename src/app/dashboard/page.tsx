'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);

    fetch('/api/my-uploads')
      .then((r) => (r.ok ? r.json() : { uploads: [] }))
      .then((j) => setUploads(j.uploads || []));

    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setStats(j?.stats || null))
      .catch(() => {});
  }, []);

  async function save(e: any) {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    const r = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
  }

  async function img(e: any, type: string) {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', e.target.files[0]);

    const r = await fetch('/api/profile-image', {
      method: 'POST',
      body: fd,
    });

    const j = await r.json();
    setMsg(j.message || j.error);
  }

  if (!me) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Dashboard</h1>
        <p className="mt-4 text-zinc-400">Bitte einloggen.</p>
      </section>
    );
  }

  const isAdmin =
    me.role === 'admin' || me.role === 'moderator';

  return (
    <section className="container py-16">
      <h1 className="text-5xl font-black">Creator Dashboard</h1>

      <p className="mt-3 text-zinc-400">
        Angemeldet als {me.email} · Rolle: {me.role}
      </p>

      {isAdmin && stats && (
        <div className="mt-8">
          <div className="card border-orange-500/30 p-6">
            <h2 className="text-2xl font-black">
              🔔 Administratorbereich
            </h2>

            <p className="mt-2 text-zinc-400">
              Aktuell warten{' '}
              <b className="text-orange-300">
                {stats.pendingUploads}
              </b>{' '}
              Uploads auf Freigabe.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin" className="btn btn-primary">
                📦 Uploadverwaltung
              </Link>

              <Link
                href="/admin/users"
                className="btn btn-soft"
              >
                👥 Nutzerverwaltung
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="card p-5">
              <p className="text-sm text-zinc-400">
                Uploads gesamt
              </p>
              <b className="text-3xl">
                {stats.totalUploads}
              </b>
            </div>

            <div className="card p-5">
              <p className="text-sm text-zinc-400">
                Wartend
              </p>
              <b className="text-3xl text-orange-300">
                {stats.pendingUploads}
              </b>
            </div>

            <div className="card p-5">
              <p className="text-sm text-zinc-400">
                Nutzer
              </p>
              <b className="text-3xl">
                {stats.users}
              </b>
            </div>

            <div className="card p-5">
              <p className="text-sm text-zinc-400">
                Downloads
              </p>
              <b className="text-3xl">
                {stats.downloads}
              </b>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={save}
          className="card mt-8 grid gap-5 p-6"
        >
          <h2 className="text-2xl font-bold">
            Profil bearbeiten
          </h2>

          <label className="label">
            Anzeigename
            <input
              className="input mt-2"
              name="display_name"
              defaultValue={me.profile?.display_name || ''}
            />
          </label>

          <label className="label">
            Bio
            <textarea
              className="input mt-2 min-h-28"
              name="bio"
              defaultValue={me.profile?.bio || ''}
            />
          </label>

          {['twitch', 'tiktok', 'youtube', 'kick', 'discord'].map(
            (x) => (
              <label
                className="label capitalize"
                key={x}
              >
                {x}
                <input
                  className="input mt-2"
                  name={x}
                  defaultValue={me.profile?.[x] || ''}
                />
              </label>
            )
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="label">
              Avatar
              <input
                className="mt-2 block"
                type="file"
                accept="image/*"
                onChange={(e) => img(e, 'avatar')}
              />
            </label>

            <label className="label">
              Banner
              <input
                className="mt-2 block"
                type="file"
                accept="image/*"
                onChange={(e) => img(e, 'banner')}
              />
            </label>
          </div>

          <button className="btn btn-primary">
            Profil speichern
          </button>

          {msg && (
            <p className="text-orange-300">{msg}</p>
          )}
        </form>

        <div className="card mt-8 p-6">
          <h2 className="text-2xl font-bold">
            Meine Uploads
          </h2>

          <div className="mt-4 space-y-3">
            {uploads.map((u) => (
              <div
                className="rounded-xl border border-zinc-800 p-4"
                key={u.id}
              >
                <b>{u.title}</b>

                <p className="text-sm text-zinc-400">
                  {u.category} · Status: {u.status} ·
                  Downloads: {u.downloads}
                </p>

                {u.rejection_reason && (
                  <p className="text-sm text-red-300">
                    Grund: {u.rejection_reason}
                  </p>
                )}
              </div>
            ))}

            {!uploads.length && (
              <p className="text-zinc-400">
                Noch keine Uploads.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
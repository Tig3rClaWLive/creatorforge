'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const profileFields = [
  { name: 'twitch', label: 'Twitch', placeholder: 'https://www.twitch.tv/deinname' },
  { name: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@deinname' },
  { name: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@deinname' },
  { name: 'kick', label: 'Kick', placeholder: 'https://kick.com/deinname' },
  { name: 'discord', label: 'Discord', placeholder: 'https://discord.gg/deincode' },
  { name: 'donation_url', label: 'Spendenlink', placeholder: 'https://streamelements.com/deinname/tip' },
];

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null));

    fetch('/api/my-uploads')
      .then((r) => (r.ok ? r.json() : { uploads: [] }))
      .then((j) => setUploads(j.uploads || []))
      .catch(() => setUploads([]));

    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setStats(j?.stats || j || null))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: any) {
    e.preventDefault();
    setMsg('');

    const data = Object.fromEntries(new FormData(e.currentTarget));

    const r = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });

    const j = await r.json().catch(() => ({}));
    setMsg(j.message || j.error || 'Profil gespeichert.');
    if (r.ok) load();
  }

  async function img(e: any, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);

    const r = await fetch('/api/profile-image', {
      method: 'POST',
      body: fd,
    });

    const j = await r.json().catch(() => ({}));
    setMsg(j.message || j.error || 'Bild gespeichert.');
    if (r.ok) load();
  }

  if (!me) {
    return (
      <section className="container py-16">
        <h1 className="text-4xl font-black">Dashboard</h1>
        <p className="mt-4 text-zinc-400">Bitte einloggen.</p>
      </section>
    );
  }

  const user = me.user || me;
  const profile = me.profile || {};
  const isAdmin = user.role === 'admin' || user.role === 'moderator';

  return (
    <section className="container py-16">
      <h1 className="text-5xl font-black">Creator Dashboard</h1>

      <p className="mt-3 text-zinc-400">Angemeldet als {user.email} · Rolle: {user.role}</p>

      {isAdmin && stats && (
        <div className="mt-8">
          <div className="card border-orange-500/30 p-6">
            <h2 className="text-2xl font-black">🔔 Administratorbereich</h2>
            <p className="mt-2 text-zinc-400">
              Aktuell warten <b className="text-orange-300">{stats.pendingUploads || 0}</b> Uploads auf Freigabe und <b className="text-yellow-300"> {stats.reports || 0}</b> Meldungen auf Prüfung.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin" className="btn btn-primary">📦 Uploadverwaltung</Link>
              <Link href="/admin/users" className="btn btn-soft">👥 Nutzerverwaltung</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={save} className="card mt-8 grid gap-5 p-6">
          <h2 className="text-2xl font-bold">Profil bearbeiten</h2>

          <label className="label">Anzeigename<input className="input mt-2" name="display_name" defaultValue={profile.display_name || ''} required /></label>

          <label className="label">Bio<textarea className="input mt-2 min-h-28" name="bio" defaultValue={profile.bio || ''} /></label>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
            Social-Links müssen echte Plattform-Links sein. Beispiel: Twitch nur twitch.tv, YouTube nur Kanal-Links, Discord nur Einladungslinks. Leere Felder sind erlaubt.
          </div>

          {profileFields.map((field) => (
            <label className="label" key={field.name}>
              {field.label}
              <input className="input mt-2" name={field.name} type="url" placeholder={field.placeholder} defaultValue={profile?.[field.name] || ''} />
            </label>
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="label">Avatar<input className="mt-2 block" type="file" accept="image/*" onChange={(e) => img(e, 'avatar')} /></label>
            <label className="label">Banner<input className="mt-2 block" type="file" accept="image/*" onChange={(e) => img(e, 'banner')} /></label>
          </div>

          <button className="btn btn-primary">Profil speichern</button>
          {msg && <p className="text-orange-300">{msg}</p>}
        </form>

        <div className="card mt-8 p-6">
          <h2 className="text-2xl font-bold">Meine Uploads</h2>

          <div className="mt-4 space-y-3">
            {uploads.map((u) => (
              <div className="rounded-xl border border-zinc-800 p-4" key={u.id}>
                <b>{u.title}</b>
                <p className="text-sm text-zinc-400">{u.category} · Status: {u.status} · Downloads: {u.downloads}</p>
                {u.rejection_reason && <p className="text-sm text-red-300">Grund: {u.rejection_reason}</p>}
              </div>
            ))}

            {!uploads.length && <p className="text-zinc-400">Noch keine Uploads.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

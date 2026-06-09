'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Register() {
  const [msg, setMsg] = useState('');
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setCreated(false);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });

    const j = await res.json().catch(() => ({}));
    setMsg(j.message || j.error || 'Registrierung abgeschlossen.');
    setLoading(false);

    if (res.ok) {
      setCreated(true);
      e.currentTarget.reset();
    }
  }

  return (
    <section className="container max-w-2xl py-16">
      <h1 className="text-5xl font-black">Creator Account erstellen</h1>
      <p className="mt-3 text-zinc-400">Uploads und Profile sind kostenlos. Neue Accounts starten immer als Creator, nicht als Admin.</p>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
        <label className="label">E-Mail<input className="input mt-2" name="email" type="email" required /></label>
        <label className="label">Passwort<input className="input mt-2" name="password" type="password" minLength={8} required /></label>
        <label className="label">Creator-Name<input className="input mt-2" name="display_name" required /></label>

        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Account wird erstellt...' : 'Account erstellen'}</button>

        {msg && <p className={created ? 'text-sm text-green-300' : 'text-sm text-orange-300'}>{msg}</p>}

        {created && (
          <Link href="/dashboard" className="btn btn-soft w-full text-center">Zum Dashboard</Link>
        )}
      </form>
    </section>
  );
}

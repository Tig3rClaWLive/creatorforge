'use client';

import { useEffect, useState } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch('/api/admin/users');
    const j = await r.json();

    setUsers(j.users || []);
    if (j.error) setMsg(j.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function setRole(id: string, role: string) {
    if (!confirm(`Rolle wirklich auf ${role} ändern?`)) return;

    const r = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });

    const j = await r.json();
    setMsg(j.message || j.error);
    load();
  }

  return (
    <section className="container py-16">
      <h1 className="text-5xl font-black">Nutzerverwaltung</h1>
      <p className="mt-3 text-zinc-400">
        Weise Nutzern Rollen zu. Moderatoren dürfen Uploads freigeben, Admins dürfen alles.
      </p>

      {msg && <p className="mt-6 text-orange-300">{msg}</p>}

      <div className="mt-10 grid gap-4">
        {users.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-bold">{u.display_name || 'Ohne Creator-Profil'}</h2>
              <p className="text-sm text-zinc-400">{u.email}</p>
              <p className="mt-1 text-sm text-orange-300">Rolle: {u.role}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRole(u.id, 'creator')} className="btn btn-soft">
                Creator
              </button>
              <button onClick={() => setRole(u.id, 'moderator')} className="btn btn-soft">
                Moderator
              </button>
              <button onClick={() => setRole(u.id, 'admin')} className="btn btn-primary">
                Admin
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
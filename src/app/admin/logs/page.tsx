'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const actionLabels: Record<string, string> = {
  approve: 'Upload freigegeben',
  reject: 'Upload abgelehnt',
  'delete-upload': 'Upload gelöscht',
  delete_upload: 'Upload gelöscht',
  'set-role': 'Rolle geändert',
  'set-verified': 'Creator verifiziert',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMsg('');

    try {
      const r = await fetch('/api/admin/logs');
      const j = await r.json();

      if (j.error) {
        setMsg(j.error);
        setLogs([]);
        return;
      }

      setLogs(j.logs || []);
    } catch {
      setMsg('Logs konnten nicht geladen werden.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    if (!needle) {
      return logs;
    }

    return logs.filter((log) => {
      const haystack = [
        log.action,
        log.message,
        log.target_id,
        log.admin_email,
        log.admin_name,
        log.created_at,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [logs, q]);

  return (
    <section className="container py-16">
      <Link href="/admin" className="text-sm text-orange-300">
        ← Zurück zum Adminbereich
      </Link>

      <div className="mt-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-5xl font-black">Admin Aktivitäten</h1>

          <p className="mt-3 text-zinc-400">
            Übersicht über Moderations- und Verwaltungsaktionen.
          </p>
        </div>

        <input
          className="input w-full lg:max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Logs suchen..."
        />
      </div>

      {msg && (
        <div className="card mt-6 border border-orange-500/30 p-4 text-orange-300">
          {msg}
        </div>
      )}

      {loading && (
        <div className="card mt-8 p-8 text-zinc-400">
          Aktivitäten werden geladen...
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="card mt-8 p-8 text-zinc-400">
          Keine Aktivitäten gefunden.
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
          >
            <div>
              <p className="text-sm uppercase tracking-widest text-orange-300">
                {actionLabels[log.action] || log.action}
              </p>

              <h2 className="mt-1 text-xl font-black">
                {log.message || 'Keine Nachricht'}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Ziel: {log.target_id || 'Unbekannt'}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Admin:{' '}
                {log.admin_name || log.admin_email || log.admin_user_id || 'Unbekannt'}
              </p>
            </div>

            <div className="text-sm text-zinc-500">
              {log.created_at}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
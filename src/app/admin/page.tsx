'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Tab = 'all' | 'pending' | 'approved' | 'rejected' | 'reports';

const statusLabels: Record<string, string> = {
  pending: 'Wartet',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
};

export default function Admin() {
  const [items, setItems] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const uploadStatus = useMemo(() => (tab === 'all' || tab === 'reports' ? '' : tab), [tab]);

  async function load() {
    setLoading(true);
    setMsg('');

    try {
      const [statsRes, uploadsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/uploads?status=${encodeURIComponent(uploadStatus)}&q=${encodeURIComponent(q)}`),
        fetch('/api/admin/reports'),
      ]);

      const statsJson = await statsRes.json().catch(() => ({}));
      const uploadsJson = await uploadsRes.json().catch(() => ({}));
      const reportsJson = await reportsRes.json().catch(() => ({}));

      setStats(statsJson.stats || statsJson || null);
      setItems(uploadsJson.uploads || []);
      setReports(reportsJson.reports || []);

      if (statsJson.error) setMsg(statsJson.error);
      if (uploadsJson.error) setMsg(uploadsJson.error);
      if (reportsJson.error) setMsg(reportsJson.error);
    } catch {
      setMsg('Admin-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadStatus]);

  async function act(id: string, action: 'approve' | 'reject' | 'delete') {
    let reason = '';

    if (action === 'reject') {
      reason = prompt('Warum wird dieser Upload abgelehnt?') || '';
      if (!reason.trim()) return;
    }

    if (action === 'delete') {
      reason = prompt('Warum wird dieser Upload gelöscht?', 'Verstoß gegen Upload-Regeln') || '';
      if (!reason.trim()) return;
      if (!confirm('Diesen Upload wirklich endgültig löschen? Datei, Vorschau und Meldungen werden entfernt.')) return;
    }

    const endpoint = action === 'delete' ? '/api/admin/delete-upload' : '/api/admin/moderate';
    const body = action === 'delete' ? { id, reason } : { id, action, reason };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const j = await r.json().catch(() => ({}));
    setMsg(j.message || j.error || 'Aktion abgeschlossen.');
    load();
  }

  function openUpload(id: string) {
    window.open(`/downloads/detail?id=${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'pending', label: 'Wartend', count: stats?.pendingUploads },
    { id: 'approved', label: 'Freigegeben', count: stats?.approvedUploads },
    { id: 'rejected', label: 'Abgelehnt', count: stats?.rejectedUploads },
    { id: 'all', label: 'Alle Uploads', count: stats?.totalUploads },
    { id: 'reports', label: 'Gemeldet', count: stats?.reports || reports.length },
  ];

  return (
    <section className="container py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black">Admin</h1>
          <p className="mt-3 text-zinc-400">Uploads prüfen, freigeben, löschen und Meldungen bearbeiten.</p>
        </div>

        <Link href="/admin/users" className="btn btn-soft">Nutzerverwaltung</Link>
      </div>

      {stats && (
        <div className="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <Stat label="Uploads gesamt" value={stats.totalUploads} />
          <Stat label="Wartend" value={stats.pendingUploads} color="text-orange-300" />
          <Stat label="Freigegeben" value={stats.approvedUploads} color="text-green-300" />
          <Stat label="Abgelehnt" value={stats.rejectedUploads} color="text-red-300" />
          <Stat label="Meldungen" value={stats.reports || reports.length} color="text-yellow-300" />
          <Stat label="Nutzer" value={stats.users} />
          <Stat label="Downloads" value={stats.downloads} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'btn btn-primary' : 'btn btn-soft'}
          >
            {t.label}{typeof t.count === 'number' ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {tab !== 'reports' && (
        <form
          className="mt-6 flex flex-col gap-3 md:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input
            className="input flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche nach Titel, Beschreibung, Kategorie, Creator oder E-Mail"
          />
          <button className="btn btn-primary">Suchen</button>
        </form>
      )}

      {msg && <p className="mt-6 text-orange-300">{msg}</p>}
      {loading && <p className="mt-6 text-zinc-400">Lade Admin-Daten...</p>}

      {tab === 'reports' ? (
        <div className="mt-10 grid gap-6">
          {reports.map((r) => (
            <div className="card p-6" key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-widest text-yellow-300">Gemeldeter Upload</p>
                  <h2 className="mt-2 text-2xl font-black">{r.upload_title || r.title || 'Upload nicht mehr vorhanden'}</h2>
                  <p className="mt-2 text-zinc-400">Grund: {r.reason}</p>
                  {r.message && <p className="mt-2 whitespace-pre-wrap text-zinc-300">{r.message}</p>}
                  <p className="mt-3 text-sm text-zinc-500">
                    Creator: {r.display_name || r.email || 'Unbekannt'} · Status: {statusLabels[r.upload_status] || r.upload_status || 'gelöscht'} · {r.created_at}
                  </p>
                </div>
              </div>

              {r.upload_id && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => openUpload(r.upload_id)} className="btn btn-soft">Öffnen</button>
                  <button onClick={() => act(r.upload_id, 'reject')} className="btn btn-soft">Ablehnen</button>
                  <button onClick={() => act(r.upload_id, 'delete')} className="btn btn-soft">Upload löschen</button>
                </div>
              )}
            </div>
          ))}

          {!reports.length && <div className="card p-8 text-zinc-400">Aktuell gibt es keine gemeldeten Uploads.</div>}
        </div>
      ) : (
        <div className="mt-10 grid gap-6">
          {items.map((x) => (
            <div className="card p-6" key={x.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{x.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-zinc-400">{x.description}</p>
                  <p className="mt-3 text-sm text-zinc-500">
                    Creator: {x.display_name || x.email || 'Unbekannt'} · Kategorie: {x.category} · Downloads: {x.downloads || 0}
                    {Number(x.reports_count || 0) > 0 ? ` · Meldungen: ${x.reports_count}` : ''}
                  </p>
                  {x.rejection_reason && <p className="mt-2 text-sm text-red-300">Ablehnungsgrund: {x.rejection_reason}</p>}
                </div>

                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-300">
                  {statusLabels[x.status] || x.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {x.status !== 'approved' && <button onClick={() => act(x.id, 'approve')} className="btn btn-primary">Freigeben</button>}
                {x.status !== 'rejected' && <button onClick={() => act(x.id, 'reject')} className="btn btn-soft">Ablehnen</button>}
                {x.status === 'approved' && <button onClick={() => openUpload(x.id)} className="btn btn-soft">Öffnen</button>}
                <button onClick={() => act(x.id, 'delete')} className="btn btn-soft">Löschen</button>
              </div>
            </div>
          ))}

          {!items.length && <div className="card p-8 text-zinc-400">Keine Uploads in dieser Ansicht gefunden.</div>}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, color = '' }: { label: string; value: any; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <b className={`text-3xl ${color}`}>{value ?? 0}</b>
    </div>
  );
}

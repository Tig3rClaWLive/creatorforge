'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function Creator(){const [items,setItems]=useState<any[]>([]); useEffect(()=>{fetch('/api/creators').then(r=>r.json()).then(j=>setItems(j.creators||[]))},[]); return <section className="container py-16"><h1 className="text-5xl font-black">Creator-Verzeichnis</h1><p className="mt-3 text-zinc-400">Kostenlose Profile für Creator, Streamer und Designer.</p><div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(c=><Link
  href={`/creator/${encodeURIComponent(c.display_name)}`}
  key={c.id}
  className="card overflow-hidden transition hover:scale-[1.02] hover:border-orange-500/50"
>{c.banner_url&&<img className="h-28 w-full object-cover" src={c.banner_url} alt="Banner"/>}<div className="p-6"><div className="flex items-center gap-4">{c.avatar_url&&<img className="h-14 w-14 rounded-full object-cover" src={c.avatar_url} alt="Avatar"/>}<div><h2 className="text-2xl font-bold">{c.display_name}</h2><p className="text-sm text-zinc-400">{c.uploads_count||0} freigegebene Uploads</p></div></div><p className="mt-4 text-zinc-300">{c.bio||'Noch keine Beschreibung.'}</p><div className="mt-4 flex flex-wrap gap-2 text-sm">{['twitch','tiktok','youtube','kick','discord'].map(k=>c[k]?<a key={k} className="rounded-full bg-zinc-800 px-3 py-1" href={String(c[k]).startsWith('http')?c[k]:'#'}>{k}</a>:null)}</div></div></Link>)}</div></section>}

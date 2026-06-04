'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Nav(){
 const [theme,setTheme]=useState('dark');
 useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');},[theme]);
 return <header className="border-b border-white/10 bg-black/40 backdrop-blur">
  <div className="container flex h-20 items-center justify-between">
   <Link href="/" className="text-2xl font-black tracking-tight">Creator<span className="text-orange-500">Forge</span></Link>
   <nav className="hidden gap-7 text-sm font-bold md:flex">
    <Link href="/downloads" className="hover:text-orange-400">Downloads</Link>
    <Link href="/creator" className="hover:text-orange-400">Creator</Link>
    <Link href="/upload" className="hover:text-orange-400">Teilen</Link>
    <Link href="/dashboard" className="hover:text-orange-400">Dashboard</Link>
    <Link href="/admin" className="hover:text-orange-400">Admin</Link>
   </nav>
   <div className="flex gap-3">
    <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="btn btn-soft text-sm">{theme==='dark'?'☀️ Hell':'🌙 Dunkel'}</button>
    <Link href="/login" className="btn btn-primary text-sm">Login</Link>
   </div>
  </div>
 </header>
}

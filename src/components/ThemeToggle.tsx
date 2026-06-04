'use client';
import { useEffect, useState } from 'react';
export default function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem('theme'); const d=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches; setDark(d); document.documentElement.classList.toggle('dark',d)},[]);
 function toggle(){const n=!dark; setDark(n); document.documentElement.classList.toggle('dark',n); localStorage.setItem('theme',n?'dark':'light')}
 return <button onClick={toggle} className="btn-secondary px-4 py-2">{dark?'☀️ Hell':'🌙 Dunkel'}</button>
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.href = '/';
  }

  const role = me?.user?.role;
  const isAdmin =
    role === 'admin' || role === 'moderator';

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur">
      <nav className="container flex items-center justify-between py-4">

        <Link
          href="/"
          className="text-2xl font-black tracking-tight"
        >
          <span className="text-orange-400">Creator</span>Forge
        </Link>

        <div className="hidden gap-5 text-sm text-zinc-300 md:flex">
          <Link href="/downloads">Downloads</Link>
          <Link href="/creator">Creator</Link>
          <Link href="/upload">Upload</Link>

          {me && (
            <Link href="/dashboard">
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <>
              <Link href="/admin">
                Admin
              </Link>

              <Link href="/admin/users">
                Nutzer
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {me ? (
            <>
              <span className="hidden text-zinc-400 sm:inline">
                {me.profile?.display_name ||
                  me.user?.email}
              </span>

              <button
                onClick={logout}
                className="btn btn-soft"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-soft"
                href="/login"
              >
                Login
              </Link>

              <Link
                className="btn btn-primary"
                href="/register"
              >
                Registrieren
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
import './globals.css';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
export const metadata: Metadata = { title: 'CreatorForge', description: 'Kostenlose Overlays, Tools und Ressourcen für Creator.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de" suppressHydrationWarning><body><Nav/>{children}<footer className="mx-auto max-w-7xl px-5 py-12 text-sm text-zinc-500"><div className="flex flex-wrap gap-4"><a href="/legal/impressum">Impressum</a><a href="/legal/datenschutz">Datenschutz</a><a href="/legal/agb">AGB</a><a href="/legal/upload-richtlinien">Upload-Richtlinien</a></div><p className="mt-4">CreatorForge bleibt kostenlos. Unterstützung per Spende ist freiwillig.</p></footer></body></html>}

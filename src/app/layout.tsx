import './globals.css';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
export const metadata: Metadata = { title: 'CreatorForge', description: 'Kostenlose Overlays, Tools und Ressourcen für Creator.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de" className="dark"><body><Nav/><main>{children}</main><Footer/></body></html>}

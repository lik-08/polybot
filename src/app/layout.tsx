import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'POLYBOT | Holographic Command Center', description: '3D-first personal investment intelligence workstation. Prototype uses demo data only.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
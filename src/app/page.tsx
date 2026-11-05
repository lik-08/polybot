'use client';
import dynamic from 'next/dynamic';
const CommandCenter = dynamic(() => import('@/components/CommandCenter'), { ssr: false, loading: () => <main className="loading">Initializing holographic command center…</main> });
export default function Page(){return <CommandCenter/>}
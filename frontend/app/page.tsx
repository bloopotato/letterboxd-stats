'use client';

import { useState } from 'react';
import UploadSection from './sections/UploadSection';
import OverviewSection from './sections/OverviewSection';
import type { EnrichedLookupEntry } from '@/utils/data/types';

export default function Home() {
  const [importedItems, setImportedItems] = useState<EnrichedLookupEntry[] | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(244,236,222,1)_48%,_rgba(238,230,214,1))] text-slate-900">
      <main className="flex flex-1 flex-col px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-secondary/80">
              Letterboxd Stats
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Import your export. See the shape of your taste.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Upload your diary and watchlist export once, write the normalized movie graph to
              Supabase, and use it to power overview stats and later visualisations.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <UploadSection onImported={setImportedItems} />
            <OverviewSection importedItems={importedItems} />
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center">
        <p className="py-6 text-xs text-slate-500">Built by</p>
      </footer>
    </div>
  );
}

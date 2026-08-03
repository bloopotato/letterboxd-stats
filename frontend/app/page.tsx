'use client';

import { useState } from 'react';
import UploadSection from '@/app/sections/UploadSection';
import OverviewSection from '@/app/sections/OverviewSection';
import StatsSection from '@/app/sections/StatsSection';
import CastSection from '@/app/sections/CastSection';
import TimelineSection from '@/app/sections/TimelineSection';
import RecentsSection from '@/app/sections/RecentsSection';
import type { RpcStats, UserFilm } from '@/types/statistics';
import { useEffect } from 'react';

export default function Home() {
  const [importedItems, setImportedItems] = useState<UserFilm[] | null>(null);
  const hasImportedData = importedItems !== null;

  const [rpcStats, setRpcStats] = useState<RpcStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const title = 'LETTERBOXD STATS';

  // Fetch RPC stats when importedItems change
  useEffect(() => {
    if (!importedItems) return;
    let cancelled = false;

    const payloadItems = importedItems
      .map((film) => ({ tmdbId: film.tmdbId }))
      .filter((film): film is { tmdbId: number } => typeof film.tmdbId === 'number');

    async function fetchStats() {
      setLoadingStats(true);
      try {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: payloadItems,
          }),
          cache: 'no-store',
        });

        const json = (await response.json()) as { ok: boolean; stats?: RpcStats; error?: string };

        if (!response.ok || !json.ok || !json.stats) {
          console.error('Error fetching RPC stats:', json.error || 'Unknown error');
        } else if (!cancelled) {
          setRpcStats(json.stats);
        }
      } catch (error) {
        console.error('Error fetching RPC stats:', error);
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    }

    void fetchStats();
    return () => {
      cancelled = true;
    };
  }, [importedItems]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-8 py-10">
        {/* Title */}
        <div className="flex flex-col items-start gap-3">
          <p className="flex w-full justify-between text-6xl font-semibold uppercase">
            {title.split('').map((char, i) => {
              let colour = '';

              if (i < 6)
                colour = 'text-primary'; // LETTER
              else if (i < 10)
                colour = 'text-secondary'; // BOXD
              else if (i > 10) colour = 'text-tertiary'; // STATS

              return (
                <span key={i} className={colour}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </p>
          <p className="text-md text-subtitle">
            A tool to uncover your watching habits, favourite films, and cinematic patterns.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          <UploadSection onImported={setImportedItems} />
          {hasImportedData && (
            <>
              <OverviewSection importedItems={importedItems} />
              <RecentsSection importedItems={importedItems} />
              <TimelineSection importedItems={importedItems} />
              <StatsSection importedItems={importedItems} stats={rpcStats} loading={loadingStats} />
              <CastSection importedItems={importedItems} stats={rpcStats} loading={loadingStats} />
            </>
          )}
        </div>
      </main>
      <footer className="flex items-center justify-center">
        <p className="py-6 text-xs">Built by</p>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EnrichedLookupEntry, OverviewStats } from '@/utils/data/types';

type OverviewSectionProps = {
  importedItems: EnrichedLookupEntry[] | null;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function OverviewSection({ importedItems }: OverviewSectionProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!hasItems) {
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              rating: item.rating ?? null,
              tmdbId: item.tmdbId ?? item.tmdb?.id ?? null,
            })),
          }),
          cache: 'no-store',
        });

        const json = (await response.json()) as {
          ok: boolean;
          stats?: OverviewStats;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.stats) {
          throw new Error(json.error || 'Unable to load overview');
        }

        if (!cancelled) setStats(json.stats);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [hasItems, items]);

  const averageRating = stats?.averageRating == null ? '—' : stats.averageRating.toFixed(2);
  const averageRuntime =
    stats?.averageRuntime == null ? '—' : `${Math.round(stats.averageRuntime)} min`;
  const visibleStats = hasItems ? stats : null;

  return (
    <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(247,242,233,0.92))] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Overview</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Your stats</h2>
        </div>
        {loading && <p className="text-sm text-slate-500">Refreshing…</p>}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && visibleStats && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Watched" value={String(visibleStats.watchedCount)} />
            <StatCard label="Average rating" value={averageRating} />
            <StatCard label="Average runtime" value={averageRuntime} />
            <StatCard label="Top genre" value={visibleStats.topGenres[0]?.name ?? '—'} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top genres</p>
              <div className="mt-3 space-y-2">
                {visibleStats.topGenres.length ? (
                  visibleStats.topGenres.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className="text-sm text-slate-500">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No genre data yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top languages</p>
              <div className="mt-3 space-y-2">
                {visibleStats.topLanguages.length ? (
                  visibleStats.topLanguages.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className="text-sm text-slate-500">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No language data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !visibleStats && (
        <p className="mt-4 text-sm text-slate-500">Import a ZIP export to populate the overview.</p>
      )}
    </section>
  );
}

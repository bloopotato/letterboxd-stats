'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CastStats } from '@/utils/data/types';
import type { EnrichedLetterboxdFilm } from '@/types/letterboxd';

type CastSectionProps = {
  importedItems: EnrichedLetterboxdFilm[] | null;
};

type CastMovieItem = {
  title: string;
  year: number | null;
};

function formatCount(count: number) {
  return `${count} film${count === 1 ? '' : 's'}`;
}

// Stat card to display key metrics
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

// Format movie for display
function formatMovieLabel(movie: CastMovieItem) {
  return movie.year ? `${movie.title} (${movie.year})` : movie.title;
}

export default function CastSection({ importedItems }: CastSectionProps) {
  const [stats, setStats] = useState<CastStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Selected diary years (null = "All years") */
  const [selectedYears, setSelectedYears] = useState<number[] | null>(null);
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const hasItems = items.length > 0;

  // Compute available diary years from diary-only items.
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .filter((item) => item.source === 'diary')
            .map((item) => {
              const year = item.date ? new Date(item.date).getFullYear() : null;

              return Number.isFinite(year) ? year : null;
            })
            .filter((year): year is number => typeof year === 'number')
        )
      ).sort((left, right) => right - left),
    [items]
  );

  const effectiveYears = selectedYears ?? availableYears;

  const visibleItems = useMemo(() => {
    if (!effectiveYears.length) return [];

    return items.filter((item) => {
      if (item.source !== 'diary' || !item.date) return false;

      const year = new Date(item.date).getFullYear();
      return Number.isFinite(year) && effectiveYears.includes(year);
    });
  }, [effectiveYears, items]);

  const castMoviesByPersonId = useMemo(() => {
    const byPersonId = new Map<number, CastMovieItem[]>();

    for (const item of visibleItems) {
      const castMembers = item.tmdb?.credits?.cast ?? [];
      if (!castMembers.length) continue;

      const movie = {
        title: item.tmdb?.title ?? item.title,
        year: item.year ?? null,
      };

      for (const castMember of castMembers) {
        const current = byPersonId.get(castMember.id) ?? [];
        current.push(movie);
        byPersonId.set(castMember.id, current);
      }
    }

    for (const movies of byPersonId.values()) {
      movies.sort((left, right) => {
        if (left.year !== right.year) {
          return (right.year ?? 0) - (left.year ?? 0);
        }

        return left.title.localeCompare(right.title);
      });
    }

    return byPersonId;
  }, [visibleItems]);

  useEffect(() => {
    if (!hasItems) {
      return;
    }

    let cancelled = false;

    async function loadCastStats() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // send only diary items that match the selected diary years
          body: JSON.stringify({
            items: visibleItems
              .map((item) => ({ tmdbId: item.tmdb?.id ?? item.film?.id }))
              .filter((it) => it.tmdbId && typeof it.tmdbId === 'number'),
          }),
          cache: 'no-store',
        });

        const json = (await response.json()) as {
          ok: boolean;
          stats?: CastStats;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.stats) {
          throw new Error(json.error || 'Unable to load cast stats');
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

    void loadCastStats();

    return () => {
      cancelled = true;
    };
  }, [visibleItems, hasItems]);

  function toggleYear(year: number) {
    setSelectedYears((current) => {
      const currentYears = current ?? [];

      if (currentYears.includes(year)) {
        const next = currentYears.filter((value) => value !== year);
        return next.length ? next : null;
      }

      return [...currentYears, year].sort((left, right) => right - left);
    });
  }

  return (
    <section className="rounded-4xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,239,229,0.94))] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Cast</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Top billed people
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Derived from TMDB credits in the imported films.
          </p>
        </div>
        {loading && <p className="text-sm text-slate-500">Refreshing…</p>}
      </div>

      {availableYears.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedYears(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              selectedYears === null
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            All years
          </button>
          {availableYears.map((year) => {
            const active = effectiveYears.includes(year);

            return (
              <button
                key={year}
                type="button"
                onClick={() => toggleYear(year)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {hasItems && !error && stats && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Imported" value={String(stats.watchedCount)} />
            <StatCard label="Top cast" value={String(stats.topCast.length)} />
            <StatCard label="Directors" value={String(stats.topDirectors.length)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top cast</p>
              <div className="mt-3 space-y-2">
                {stats.topCast.length ? (
                  stats.topCast.map((person) => (
                    <div
                      key={person.id}
                      className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-800">{person.name}</span>
                        <span className="text-sm text-slate-500">{formatCount(person.count)}</span>
                      </div>
                      {castMoviesByPersonId.get(person.id)?.length ? (
                        <div className="space-y-1 pl-1">
                          {castMoviesByPersonId
                            .get(person.id)!
                            .slice(0, 3)
                            .map((movie) => (
                              <p
                                key={`${person.id}-${movie.title}-${movie.year ?? 'na'}`}
                                className="text-xs text-slate-500"
                              >
                                {formatMovieLabel(movie)}
                              </p>
                            ))}
                          {castMoviesByPersonId.get(person.id)!.length > 3 && (
                            <p className="text-xs text-slate-400">
                              +{castMoviesByPersonId.get(person.id)!.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No cast data yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top directors</p>
              <div className="mt-3 space-y-2">
                {stats.topDirectors.length ? (
                  stats.topDirectors.map((person) => (
                    <div key={person.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">{person.name}</span>
                      <span className="text-sm text-slate-500">{formatCount(person.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No director data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasItems && !loading && !error && (
        <p className="mt-4 text-sm text-slate-500">Import a ZIP export to populate cast stats.</p>
      )}
    </section>
  );
}

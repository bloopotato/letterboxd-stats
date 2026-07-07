'use client';

import { useMemo } from 'react';
import type { UserFilm } from '@/types/statistics';

type OverviewSectionProps = {
  importedItems: UserFilm[];
};

type RankedItem = {
  name: string;
  count: number;
};

type RecentWatchEntry = {
  film: UserFilm;
  index: number;
};

type OverviewData = {
  importedCount: number;
  diaryCount: number;
  ratedCount: number;
  tmdbMatchedCount: number;
  watchlistCount: number;
  averageRating: number | null;
  averageRuntime: number | null;
  topTags: RankedItem[];
  recentWatchHistory: RecentWatchEntry[];
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function formatRating(value: number | null) {
  return value == null ? '—' : value.toFixed(2);
}

function formatRuntime(value: number | null) {
  return value == null ? '—' : `${Math.round(value)} min`;
}

function parseDateScore(value?: string | null) {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function getRecentDate(film: UserFilm) {
  return film.watchedEvents[0]?.date ?? null;
}

function buildOverviewData(importedItems: UserFilm[]): OverviewData {
  const tagCounts = new Map<string, number>();
  const recentWatchHistory: RecentWatchEntry[] = [];

  let diaryCount = 0;
  let ratedCount = 0;
  let tmdbMatchedCount = 0;
  let watchlistCount = 0;
  let ratingSum = 0;
  let runtimeSum = 0;
  let runtimeCount = 0;

  console.log('imported items: ', importedItems);

  importedItems.forEach((film, index) => {
    if (film.inWatchlist) {
      watchlistCount += 1;
    }

    diaryCount += film.watchedEvents.length;

    if (film.rating != null) {
      ratedCount += 1;
      ratingSum += film.rating;
    }

    if (film.runtime != null) {
      runtimeSum += film.runtime;
      runtimeCount += 1;
    }
    if (film.cached || film.runtime != null) {
      tmdbMatchedCount += 1;
    }

    for (const event of film.watchedEvents) {
      recentWatchHistory.push({ film, index });

      for (const tag of event.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  });

  recentWatchHistory.sort((left, right) => {
    const dateDelta =
      parseDateScore(getRecentDate(right.film)) - parseDateScore(getRecentDate(left.film));
    if (dateDelta !== 0) return dateDelta;
    return right.index - left.index;
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    importedCount: importedItems.length,
    diaryCount,
    ratedCount,
    tmdbMatchedCount,
    watchlistCount,
    averageRating: ratedCount ? ratingSum / ratedCount : null,
    averageRuntime: runtimeCount ? runtimeSum / runtimeCount : null,
    topTags,
    recentWatchHistory: recentWatchHistory.slice(0, 4),
  };
}

export default function OverviewSection({ importedItems }: OverviewSectionProps) {
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const overview = useMemo(() => buildOverviewData(items), [items]);
  const hasItems = overview.importedCount > 0;

  return (
    <section className="flex flex-col w-full gap-4">
      {/* Header */}
      <div className="">
        <h2 className="text-4xl font-semibold tracking-tight">Overview of your stats</h2>
      </div>

      {hasItems && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Imported" value={String(overview.importedCount)} />
            <StatCard label="Diary entries" value={String(overview.diaryCount)} />
            <StatCard label="Rated entries" value={String(overview.ratedCount)} />
            <StatCard label="Watchlist" value={String(overview.watchlistCount)} />
            <StatCard label="Average rating" value={formatRating(overview.averageRating)} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-border/70 bg-white/70 px-3 py-1">
              TMDB matches {overview.tmdbMatchedCount}
            </span>
            <span className="rounded-full border border-border/70 bg-white/70 px-3 py-1">
              Average runtime {formatRuntime(overview.averageRuntime)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top tags</p>
              <div className="mt-3 space-y-2">
                {overview.topTags.length ? (
                  overview.topTags.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      <span className="text-sm text-slate-500">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No tag data yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recent watches</p>
              <div className="mt-3 space-y-2">
                {overview.recentWatchHistory.length ? (
                  overview.recentWatchHistory.map(({ film }, index) => (
                    <div
                      key={`${film.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-slate-800">{film.name}</span>
                      <span className="text-sm text-slate-500">
                        {film.year || '—'} · {formatRating(film.rating)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No watch history yet.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recent diary</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  Latest 4 entries
                </h3>
              </div>
            </div>

            {overview.recentWatchHistory.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overview.recentWatchHistory.map(({ film }) => {
                  const linkHref = film.letterboxdUri;
                  const releaseYear = film.year ?? '—';
                  const rating = film.rating == null ? 'No rating' : `${film.rating.toFixed(1)}/5`;
                  const recentDate = getRecentDate(film);
                  const watchedDate = recentDate
                    ? new Date(recentDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent diary entry';

                  const card = (
                    <div className="group overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex aspect-2/3 items-center justify-center bg-[linear-gradient(180deg,rgba(23,23,23,0.9),rgba(71,85,105,0.85))] px-4 text-center">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                            Letterboxd
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white/90">{film.name}</p>
                        </div>
                      </div>

                      <div className="space-y-2 p-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            {watchedDate}
                          </p>
                          <h4 className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-slate-900">
                            {film.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {releaseYear}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{rating}</span>
                          {film.watchedEvents.some(
                            (event: (typeof film.watchedEvents)[number]) => event.rewatch
                          ) && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
                              Rewatch
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          Click to open this entry on Letterboxd.
                        </p>
                      </div>
                    </div>
                  );

                  if (!linkHref) {
                    return <div key={`${film.name}-${watchedDate}`}>{card}</div>;
                  }

                  return (
                    <a
                      key={`${film.name}-${watchedDate}`}
                      href={linkHref}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      aria-label={`Open ${film.name} on Letterboxd`}
                    >
                      {card}
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No diary entries yet.</p>
            )}
          </div>
        </div>
      )}

      {!hasItems && (
        <p className="mt-4 text-sm text-slate-500">Import a ZIP export to populate the overview.</p>
      )}
    </section>
  );
}

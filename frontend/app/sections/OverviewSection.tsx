'use client';

import { useMemo } from 'react';
import type { UserFilm } from '@/types/statistics';
import OverviewCard from '../components/OverviewCard';

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
  runtimeSum: number;
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

function formatRuntime(value: number | null, unit: 'min' | 'h' = 'h') {
  if (value == null) return '—';
  if (unit === 'h') {
    return `${(value / 60).toFixed(1)}`;
  }
  return `${Math.round(value)}`;
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
    runtimeSum,
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
        <h2 className="text-4xl font-semibold tracking-tight">In total, you&apos;ve seen...</h2>
      </div>

      {hasItems && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 grid-cols-3">
            <OverviewCard title="movies" value={String(overview.importedCount)} />
            <OverviewCard title="hours" value={formatRuntime(overview.runtimeSum, 'h')} />
            <OverviewCard title="diary entries" value={String(overview.diaryCount)} />
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
        </div>
      )}

      {!hasItems && (
        <p className="mt-4 text-sm text-slate-500">Import a ZIP export to populate the overview.</p>
      )}
    </section>
  );
}

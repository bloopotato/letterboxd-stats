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

type WatchEvent = UserFilm['watchedEvents'][number];

type RecentWatchEntry = {
  film: UserFilm;
  event: WatchEvent;
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

function formatRating(value: number | null) {
  return value == null ? '—' : value.toFixed(2);
}

function formatRuntime(value: number | null, unit: 'min' | 'h' = 'h') {
  if (value == null) return '—';

  return unit === 'h' ? `${(value / 60).toFixed(1)}` : `${Math.round(value)}`;
}

function parseDateScore(value?: string | null) {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function formatWatchDate(value?: string | null) {
  if (!value) return 'Date unknown';

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(timestamp);
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

  importedItems.forEach((film, index) => {
    if (film.inWatchlist) watchlistCount += 1;

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
      recentWatchHistory.push({ film, event, index });

      for (const tag of event.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  });

  recentWatchHistory.sort((left, right) => {
    const dateDelta = parseDateScore(right.event.date) - parseDateScore(left.event.date);

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

function StatCard({
  label,
  value,
  detail,
  index,
}: {
  label: string;
  value: string;
  detail: string;
  index: string;
}) {
  return (
    <article className="group min-w-0 border-y border-border py-5 sm:py-6">
      <div className="mb-8 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
        <span className="font-mono text-[10px] text-accent">{index}</span>
      </div>

      <p className="font-serif text-5xl font-normal tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-6xl">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-muted">{detail}</p>
    </article>
  );
}

export default function OverviewSection({ importedItems }: OverviewSectionProps) {
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const overview = useMemo(() => buildOverviewData(items), [items]);
  const hasItems = overview.importedCount > 0;

  return (
    <section id="overview" className="flex w-full flex-col gap-10">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Your film archive / 01
        </p>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              By the numbers.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              A quantitative portrait of your life in cinema. Every entry, every rewatch, every
              hour.
            </p>
          </div>

          {hasItems && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {overview.importedCount.toLocaleString('en-GB')} films indexed
            </p>
          )}
        </div>
      </header>

      {!hasItems ? (
        <div className="border-y border-border px-6 py-12">
          <p className="font-mono text-xs text-accent">NO ARCHIVE FOUND</p>
          <p className="mt-3 font-serif text-2xl text-foreground">Your story starts here.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Import your Letterboxd ZIP export to explore your viewing history.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Primary statistics */}
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-3">
            <StatCard
              label="Films in archive"
              value={overview.importedCount.toLocaleString('en-GB')}
              detail="Unique films imported"
              index="01"
            />
            <StatCard
              label="Time at the cinema"
              value={formatRuntime(overview.runtimeSum)}
              detail="Hours of recorded runtime"
              index="02"
            />
            <StatCard
              label="Diary entries"
              value={overview.diaryCount.toLocaleString('en-GB')}
              detail="Including rewatches"
              index="03"
            />
          </div>

          {/* Archive facts */}
          <div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
            {[
              {
                label: 'Average rating',
                value: formatRating(overview.averageRating),
              },
              {
                label: 'Average runtime',
                value: `${formatRuntime(overview.averageRuntime, 'min')} min`,
              },
              {
                label: 'TMDB matches',
                value: overview.tmdbMatchedCount.toLocaleString('en-GB'),
              },
              {
                label: 'Watchlist',
                value: overview.watchlistCount.toLocaleString('en-GB'),
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`py-4 pr-3 ${index % 2 === 1 ? 'pl-4' : ''} ${
                  index < 2 ? 'border-b border-border sm:border-b-0' : ''
                } ${
                  index === 1 || index === 3 ? 'sm:border-r-0' : 'sm:border-r sm:border-border'
                } ${index >= 2 ? 'sm:pl-5' : ''}`}
              >
                <p className="text-xs text-muted">{item.label}</p>
                <p className="mt-2 font-serif text-2xl text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tags and recent watches */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <article className="min-w-0">
              <div className="mb-6 border-b border-border pb-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Field notes / 01
                </p>
                <h3 className="mt-2 font-serif text-3xl font-normal text-foreground">
                  Your viewing habits.
                </h3>
                <p className="mt-2 text-xs text-muted">
                  The tags that recur throughout your diary.
                </p>
              </div>

              {overview.topTags.length ? (
                <ol className="space-y-5">
                  {overview.topTags.map((item, index) => {
                    const maxCount = overview.topTags[0].count;
                    const percentage = maxCount ? (item.count / maxCount) * 100 : 0;

                    return (
                      <li key={`${item.name}-${index}`}>
                        <div className="mb-2 flex items-baseline justify-between gap-3">
                          <div className="flex min-w-0 items-baseline gap-3">
                            <span className="font-mono text-[10px] text-accent">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="truncate text-sm text-foreground">{item.name}</span>
                          </div>
                          <span className="font-mono text-xs text-muted">{item.count}</span>
                        </div>

                        <div className="ml-7 h-px bg-border">
                          <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="py-6 text-sm text-muted">No tag data in your diary yet.</p>
              )}
            </article>

            <article className="min-w-0">
              <div className="mb-6 border-b border-border pb-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Screening log / 02
                </p>
                <h3 className="mt-2 font-serif text-3xl font-normal text-foreground">
                  Recently watched.
                </h3>
                <p className="mt-2 text-xs text-muted">The latest entries in your film diary.</p>
              </div>

              {overview.recentWatchHistory.length ? (
                <ol className="divide-y divide-border">
                  {overview.recentWatchHistory.map(({ film, event, index }, rowIndex) => (
                    <li
                      key={`${film.name}-${event.date ?? 'unknown'}-${index}-${rowIndex}`}
                      className="flex items-start justify-between gap-4 py-4 first:pt-0"
                    >
                      <div className="flex min-w-0 gap-3">
                        <span className="pt-1 font-mono text-[10px] text-accent">
                          {String(rowIndex + 1).padStart(2, '0')}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {film.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {film.year || 'Year unknown'}
                            {event.tags.length > 0 && ` · ${event.tags.slice(0, 2).join(', ')}`}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-mono text-xs text-foreground">
                          {formatRating(film.rating)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted">{formatWatchDate(event.date)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-6 text-sm text-muted">No watch history yet.</p>
              )}
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

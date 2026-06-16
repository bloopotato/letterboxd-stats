'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { EnrichedLetterboxdFilm } from '@/types/letterboxd';

type OverviewSectionProps = {
  importedItems: EnrichedLetterboxdFilm[] | null;
};

type RankedItem = {
  name: string;
  count: number;
};

type RecentDiaryEntry = {
  item: EnrichedLetterboxdFilm;
  index: number;
};

type OverviewData = {
  importedCount: number;
  diaryCount: number;
  ratedCount: number;
  tmdbMatchedCount: number;
  averageRating: number | null;
  averageRuntime: number | null;
  topGenres: RankedItem[];
  topLanguages: RankedItem[];
  recentDiary: EnrichedLetterboxdFilm[];
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

function getPosterUrl(item: EnrichedLetterboxdFilm) {
  const posterPath = item.tmdb?.poster_path ?? item.film?.poster_path;

  return posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : null;
}

function parseDateScore(value?: string | null) {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function getRecentDate(item: EnrichedLetterboxdFilm) {
  return item.watchedDate ?? item.diaryDate ?? null;
}

function buildOverviewData(items: EnrichedLetterboxdFilm[]): OverviewData {
  const genreCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();
  const recentDiary: RecentDiaryEntry[] = [];

  let diaryCount = 0;
  let ratedCount = 0;
  let tmdbMatchedCount = 0;
  let ratingSum = 0;
  let runtimeSum = 0;
  let runtimeCount = 0;

  items.forEach((item, index) => {
    if (item.source === 'diary') {
      diaryCount += 1;
      recentDiary.push({ item, index });
    }

    if (typeof item.rating === 'number') {
      ratedCount += 1;
      ratingSum += item.rating;
    }

    const runtime = item.tmdb?.runtime;
    if (typeof runtime === 'number') {
      runtimeSum += runtime;
      runtimeCount += 1;
    }

    if (item.tmdb || item.film) {
      tmdbMatchedCount += 1;
    }

    for (const genre of item.tmdb?.genres ?? []) {
      genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
    }

    for (const language of item.tmdb?.spoken_languages ?? []) {
      const name = language.english_name || language.name;
      languageCounts.set(name, (languageCounts.get(name) ?? 0) + 1);
    }
  });

  recentDiary.sort((left, right) => {
    const dateDelta = parseDateScore(getRecentDate(right.item)) - parseDateScore(getRecentDate(left.item));
    if (dateDelta !== 0) return dateDelta;
    return right.index - left.index;
  });

  const topGenres = Array.from(genreCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topLanguages = Array.from(languageCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    importedCount: items.length,
    diaryCount,
    ratedCount,
    tmdbMatchedCount,
    averageRating: ratedCount ? ratingSum / ratedCount : null,
    averageRuntime: runtimeCount ? runtimeSum / runtimeCount : null,
    topGenres,
    topLanguages,
    recentDiary: recentDiary.slice(0, 4).map(({ item }) => item),
  };
}

export default function OverviewSection({ importedItems }: OverviewSectionProps) {
  const items = useMemo(() => importedItems ?? [], [importedItems]);
  const overview = useMemo(() => buildOverviewData(items), [items]);
  const hasItems = overview.importedCount > 0;

  return (
    <section className="rounded-4xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,242,233,0.92))] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Overview</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Your stats</h2>
          <p className="mt-1 text-sm text-slate-500">
            Derived from the enriched films you just imported.
          </p>
        </div>
      </div>

      {hasItems && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Imported" value={String(overview.importedCount)} />
            <StatCard label="Diary entries" value={String(overview.diaryCount)} />
            <StatCard label="Rated entries" value={String(overview.ratedCount)} />
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
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Top genres</p>
              <div className="mt-3 space-y-2">
                {overview.topGenres.length ? (
                  overview.topGenres.map((item, index) => (
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
                {overview.topLanguages.length ? (
                  overview.topLanguages.map((item, index) => (
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

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recent diary</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  Latest 4 entries
                </h3>
              </div>
            </div>

            {overview.recentDiary.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overview.recentDiary.map((item) => {
                  const posterUrl = getPosterUrl(item);
                  const linkHref = item.letterboxdUri;
                  const releaseYear = item.year ?? item.film?.release_date?.slice(0, 4) ?? '—';
                  const rating = item.rating == null ? 'No rating' : `${item.rating.toFixed(1)}/5`;
                  const recentDate = getRecentDate(item);
                  const watchedDate = recentDate
                    ? new Date(recentDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent diary entry';

                  const card = (
                    <div className="group overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="relative aspect-2/3 bg-slate-100">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={`${item.title} poster`}
                            fill
                            sizes="(max-width: 1280px) 50vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(23,23,23,0.9),rgba(71,85,105,0.85))] px-4 text-center">
                            <p className="text-sm font-medium text-white/85">No poster available</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 p-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            {watchedDate}
                          </p>
                          <h4 className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-slate-900">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {releaseYear}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{rating}</span>
                          {item.rewatch && (
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
                    return <div key={`${item.title}-${watchedDate}`}>{card}</div>;
                  }

                  return (
                    <a
                      key={`${item.title}-${watchedDate}`}
                      href={linkHref}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      aria-label={`Open ${item.title} on Letterboxd`}
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

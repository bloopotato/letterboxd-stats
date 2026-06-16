'use client';

import { useState } from 'react';
import { parseLetterboxdZip } from '@/utils/data/parseZip';
import normalise from '@/utils/data/normalise';
import { EnrichedLetterboxdFilm, LetterboxdFilm } from '@/types/letterboxd';

type UploadSectionProps = {
  onImported?: (results: EnrichedLetterboxdFilm[]) => void;
};

export default function UploadSection({ onImported }: UploadSectionProps) {
  const [loading, setLoading] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedLetterboxdFilm[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

  function estimateDurationMs(itemCount: number) {
    return Math.max(3000, itemCount * 600);
  }

  function formatEta(seconds: number) {
    if (seconds <= 0) return 'Less than 1 second';
    if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    let progressTimer: number | null = null;

    try {
      setLoading(true);
      setEnriched(null);

      // (1) Parse the ZIP file and extract diary/watchlist entries
      const parsedData = await parseLetterboxdZip(file);

      // (2) Normalise and merge the entries into a single list of lookup items
      const diaryFilms = normalise.normaliseFromDiary(parsedData.diary);
      const watchlistFilms = normalise.normaliseFromWatchlist(parsedData.watchlist);
      const items: LetterboxdFilm[] = normalise.mergeCollections(diaryFilms, watchlistFilms);
      const estimatedTotalMs = estimateDurationMs(items.length);
      const startedAt = Date.now();

      setProgress(0);
      setEtaSeconds(Math.ceil(estimatedTotalMs / 1000));

      progressTimer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const nextProgress = Math.min(95, Math.round((elapsed / estimatedTotalMs) * 100));
        const remainingMs = Math.max(0, estimatedTotalMs - elapsed);
        setProgress(nextProgress);
        setEtaSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
      }, 250);

      // (3) Lookup in supabase
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Lookup failed');

      if (progressTimer != null) {
        window.clearInterval(progressTimer);
      }
      setProgress(100);
      setEtaSeconds(0);

      const results: EnrichedLetterboxdFilm[] = json.results;
      setEnriched(results);
      onImported?.(results);
    } catch (error) {
      console.error('Error parsing/enriching ZIP file:', error);
    } finally {
      if (progressTimer != null) {
        window.clearInterval(progressTimer);
      }
      setLoading(false);
      setProgress(0);
      setEtaSeconds(null);
    }
  }

  return (
    <section className="mx-auto mt-16 w-full max-w-2xl px-4 sm:px-0">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Upload your Letterboxd export
        </h2>
        <p className="mt-2 text-sm text-secondary/80">
          Choose the Letterboxd .zip export and we&apos;ll handle the stats.
        </p>
      </div>

      <label
        htmlFor="letterboxd-upload"
        className="group flex cursor-pointer flex-col items-center justify-center rounded-4xl border border-border/80 bg-white/80 p-8 text-center shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-secondary/50 hover:bg-secondary/5 hover:shadow-xl dark:bg-card/90"
      >
        <input
          id="letterboxd-upload"
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={handleFileUpload}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold tracking-[0.2em] text-secondary transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary/20">
          ZIP
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-lg font-semibold sm:text-xl">Drop your ZIP export here</p>
          <p className="text-sm text-secondary/80">or click to browse your files</p>
        </div>
      </label>

      <div className="mt-8">
        {loading && <p>Parsing and enriching…</p>}
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-secondary transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{progress}% complete</span>
              <span>{etaSeconds != null ? `About ${formatEta(etaSeconds)} left` : ''}</span>
            </div>
          </div>
        )}
        {enriched && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm text-muted">Imported entries</p>
              <p className="text-2xl font-semibold">{enriched.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                {enriched.filter((entry) => entry.tmdb).length} matched in TMDB
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

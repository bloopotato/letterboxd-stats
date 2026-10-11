'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { parseLetterboxdZip } from '@/utils/data/parseZip';
import { buildUserFilmMap } from '@/utils/data/normalise';
import type { UserFilm } from '@/types/statistics';

type UploadSectionProps = {
  onImported?: (results: UserFilm[]) => void;
};

const INSTRUCTIONS = [
  'Export your data from Letterboxd Settings',
  'Choose the downloaded ZIP file',
  'Your archive is processed and analysed',
];

function ArchiveIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16v13H4z" />
      <path d="M3 3h18v4H3zM9 11h6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 14v5h14v-5" />
    </svg>
  );
}

function formatEta(seconds: number) {
  if (seconds <= 0) return 'Finishing up…';
  if (seconds < 60) return `${seconds}s remaining`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s remaining`;
}

export default function UploadSection({ onImported }: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [enriched, setEnriched] = useState<UserFilm[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please choose a Letterboxd ZIP export.');
      return;
    }

    if (loading) return;

    let progressTimer: number | null = null;

    try {
      setLoading(true);
      setError('');
      setEnriched(null);
      setFileName(file.name);
      setProgress(0);

      // Parse the Letterboxd archive.
      const parsedData = await parseLetterboxdZip(file);

      // Build the unique film map.
      const films = Array.from(
        buildUserFilmMap(
          parsedData.diary,
          parsedData.watchlist,
          parsedData.watched,
          parsedData.ratings
        ).values()
      );

      // Estimate processing time for the progress indicator.
      const estimatedTotalMs = Math.max(3000, films.length * 600);
      const startedAt = Date.now();

      setEtaSeconds(Math.ceil(estimatedTotalMs / 1000));

      progressTimer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const nextProgress = Math.min(95, Math.round((elapsed / estimatedTotalMs) * 100));
        const remainingMs = Math.max(0, estimatedTotalMs - elapsed);

        setProgress(nextProgress);
        setEtaSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
      }, 250);

      // Enrich films through the lookup API.
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: films }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Could not process your archive.');
      }

      const enrichedFilms: UserFilm[] = json.films;

      if (progressTimer !== null) {
        window.clearInterval(progressTimer);
        progressTimer = null;
      }

      setProgress(100);
      setEtaSeconds(0);
      setEnriched(enrichedFilms);
      onImported?.(enrichedFilms);
    } catch (err) {
      console.error('Error processing Letterboxd ZIP:', err);

      setError(
        err instanceof Error ? err.message : 'Something went wrong while processing your archive.'
      );
    } finally {
      if (progressTimer !== null) {
        window.clearInterval(progressTimer);
      }

      setLoading(false);
      setProgress(0);
      setEtaSeconds(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again.
    event.target.value = '';

    if (file) {
      void processFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (file) {
      void processFile(file);
    }
  }

  return (
    <section className="w-full space-y-5">
      {/* Main import card */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`grid gap-5 border p-5 transition-colors duration-200 sm:p-6 ${
          isDragging ? 'border-accent bg-surface-hover' : 'border-border bg-surface'
        }`}
      >
        {/* Index */}
        <div className="hidden self-start pt-1 font-mono text-xs text-accent sm:block">01</div>

        {/* Archive details */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-accent">
            <ArchiveIcon size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {loading
                ? 'Processing archive'
                : enriched
                  ? 'Archive imported'
                  : 'Your personal archive'}
            </p>

            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              {loading
                ? 'Unpacking your film history…'
                : enriched
                  ? 'Your archive is ready.'
                  : 'Import your Letterboxd archive'}
            </h2>

            <p className="mt-1 break-words text-sm leading-6 text-muted">
              {loading
                ? fileName
                : enriched
                  ? `${enriched.length.toLocaleString()} films processed · ${fileName}`
                  : 'Export your data from Letterboxd, then select the ZIP file to uncover your watching habits.'}
            </p>
          </div>
        </div>

        {/* File input and action */}
        <div className="flex flex-col gap-2 sm:items-end">
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            aria-label="Choose Letterboxd ZIP archive"
            className="sr-only"
            disabled={loading}
            onChange={handleFileChange}
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
          >
            <UploadIcon />
            {loading ? 'Processing…' : enriched ? 'Replace archive' : 'Choose .zip file'}
          </button>

          <span className="font-mono text-[10px] text-muted">ZIP FILE · PRIVATE BY DESIGN</span>
        </div>
      </div>

      {/* Drag-and-drop hint */}
      {!loading && (
        <p className="text-center text-xs text-muted">
          Or drag and drop your ZIP file into the import card.
        </p>
      )}

      {/* Progress */}
      {loading && (
        <div
          className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          role="status"
          aria-live="polite"
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Matching films with movie database records</span>
            <span className="font-mono text-xs text-accent">{progress}%</span>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-label="Archive processing progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between gap-3 font-mono text-[10px] text-muted">
            <span>PLEASE KEEP THIS PAGE OPEN</span>
            <span>{etaSeconds !== null ? formatEta(etaSeconds) : 'Calculating…'}</span>
          </div>
        </div>
      )}

      {/* Success */}
      {enriched && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium">Import complete</p>
            <p className="mt-1 text-xs text-muted">
              Your statistics have been updated with {enriched.length.toLocaleString()} films.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Minimal instructions */}
      {!loading && (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {INSTRUCTIONS.map((instruction, index) => (
            <div key={instruction} className="flex items-start gap-3">
              <span className="font-mono text-[10px] text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-xs leading-5 text-muted">{instruction}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

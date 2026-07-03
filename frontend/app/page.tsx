'use client';

import { useState } from 'react';
import UploadSection from './sections/UploadSection';
import OverviewSection from './sections/OverviewSection';
import CastSection from './sections/CastSection';
import type { EnrichedLetterboxdFilm } from '@/types/letterboxd';

export default function Home() {
  const [importedItems, setImportedItems] = useState<EnrichedLetterboxdFilm[] | null>(null);
  const hasImportedData = importedItems !== null;
  const title = 'LETTERBOXD STATS';
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
          {hasImportedData && <OverviewSection importedItems={importedItems} />}
          {hasImportedData && <CastSection importedItems={importedItems} />}
        </div>
      </main>
      <footer className="flex items-center justify-center">
        <p className="py-6 text-xs">Built by</p>
      </footer>
    </div>
  );
}

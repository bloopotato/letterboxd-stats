'use client';

import { useState, useEffect } from 'react';
import UploadSection from './sections/UploadSection';
import OverviewSection from './sections/OverviewSection';
import type { UserFilm } from '@/types/statistics';
import StatsSection from './sections/StatsSection';
import CastSection from './sections/CastSection';
import TimelineSection from './sections/TimelineSection';
import RecentsSection from './sections/RecentsSection';
import LanguageSection from './sections/LanguageSection';
import MovieMapSection from './sections/MovieMapSection';
import Nav from './components/Nav';

export default function Home() {
  const [importedItems, setImportedItems] = useState<UserFilm[] | null>(null);
  const hasImportedData = importedItems !== null;
  const title = 'LETTERBOXD STATS';

  type Theme = 'letterboxd' | 'midnight' | 'film-negative' | 'violet';
  type Tab = 'stats' | 'elo';

  const [theme, setTheme] = useState<Theme>('letterboxd');
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('reelcount-theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav
        theme={theme}
        onThemeChange={setTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-8 sm:px-10 lg:px-12">
        {/* Editorial introduction + archive import */}
        <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left: Editorial introduction */}
          <div className="flex flex-col pt-2">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              A study of your screen life
            </p>

            <h1 className="max-w-xl text-6xl font-normal leading-[0.95] tracking-tight sm:text-7xl xl:text-8xl">
              A life in
              <br />
              <span className="font-serif italic text-accent">cinema.</span>
            </h1>

            <p className="mt-8 max-w-md text-sm leading-7 text-subtitle sm:text-base">
              Every film leaves a trace. Explore the stories you return to, the directors you
              follow, and the patterns hidden in your personal film history.
            </p>

            <div className="mt-10 max-w-md border-t border-border pt-5">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Inside your archive
              </p>

              <div className="space-y-3">
                {[
                  ['01', 'Watching habits', 'When and how you watch'],
                  ['02', 'Cinematic tastes', 'Your ratings, genres and cast'],
                  ['03', 'Film history', 'A timeline of your screen life'],
                ].map(([number, title, description]) => (
                  <div key={number} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="font-mono text-xs text-accent">{number}</span>

                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-1 text-xs text-muted">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-muted">
              A personal study of cinema
            </p>
          </div>

          {/* Right: Import interface */}
          <div className="min-w-0 lg:pt-2">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                01 / Import archive
              </p>
              <span className="font-mono text-[10px] text-muted">ZIP FILE</span>
            </div>

            <UploadSection onImported={setImportedItems} />
          </div>
        </section>

        {/* Statistics appear only after import */}
        {hasImportedData && (
          <section className="flex flex-col gap-8">
            <div className="border-t border-border pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Your personal retrospective
              </p>
              <h2 className="mt-3 font-serif text-3xl font-normal sm:text-4xl">
                The archive, examined.
              </h2>
            </div>

            <OverviewSection importedItems={importedItems} />
            <RecentsSection importedItems={importedItems} />
            <TimelineSection importedItems={importedItems} />
            <StatsSection importedItems={importedItems} />
            <CastSection importedItems={importedItems} />
            <LanguageSection importedItems={importedItems} />
            <MovieMapSection importedItems={importedItems} />
          </section>
        )}
      </main>

      <footer className="flex items-center justify-center">
        <p className="py-6 text-xs">Built by</p>
      </footer>
    </div>
  );
}

'use client';

type Theme = 'letterboxd' | 'midnight' | 'film-negative' | 'violet';
type Tab = 'stats' | 'elo';

type NavProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const themes: { id: Theme; label: string }[] = [
  { id: 'letterboxd', label: 'Letterboxd' },
  { id: 'midnight', label: 'Midnight Cinema' },
  { id: 'film-negative', label: 'Film Negative' },
  { id: 'violet', label: 'Violet Screening Room' },
];

export default function Nav({ theme, onThemeChange, activeTab, onTabChange }: NavProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Brand */}
        <h1 className="text-lg font-semibold uppercase tracking-widest text-foreground sm:text-xl">
          LETTERBOXD STATS
        </h1>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex items-center rounded-full border border-border bg-surface p-1"
        >
          <button
            type="button"
            onClick={() => onTabChange('stats')}
            aria-pressed={activeTab === 'stats'}
            className={`rounded-full px-3 py-2 text-xs transition-colors sm:px-5 sm:text-sm ${
              activeTab === 'stats'
                ? 'bg-accent text-background'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Statistics
          </button>

          <button
            type="button"
            onClick={() => onTabChange('elo')}
            aria-pressed={activeTab === 'elo'}
            className={`rounded-full px-3 py-2 text-xs transition-colors sm:px-5 sm:text-sm ${
              activeTab === 'elo' ? 'bg-accent text-background' : 'text-muted hover:text-foreground'
            }`}
          >
            Elo ranking
          </button>
        </nav>

        {/* Circular theme switcher */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2" role="group" aria-label="Colour theme">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={`Use ${item.label} theme`}
                aria-pressed={theme === item.id}
                onClick={() => onThemeChange(item.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
                  theme === item.id
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                    : 'hover:scale-110'
                }`}
              >
                <span
                  className={`h-full w-full rounded-full border ${
                    item.id === 'letterboxd'
                      ? 'border-[#00d084] bg-[#00d084]'
                      : item.id === 'midnight'
                        ? 'border-[#c5a572] bg-[#c5a572]'
                        : item.id === 'film-negative'
                          ? 'border-[#e45b43] bg-[#e45b43]'
                          : 'border-[#b69ae8] bg-[#b69ae8]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

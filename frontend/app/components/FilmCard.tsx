import { UserFilm, WatchedEvent } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';
import Image from 'next/image';

export default function FilmCard({
  film,
  watchedEvent,
}: {
  film: UserFilm;
  watchedEvent: WatchedEvent | null;
}) {
  return (
    <div className="group overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Film Poster */}
      <div className="relative aspect-2/3 overflow-hidden">
        <Image
          src={getPosterUrl(film.posterPath, 'w342')}
          alt={film.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-4">
          <p className="line-clamp-2 text-lg font-semibold text-white">{film.name}</p>

          <p className="text-sm text-white/80">{film.year}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {watchedEvent && (
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {new Date(watchedEvent.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {film.rating && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs">★ {film.rating}</span>
          )}

          <span className="rounded-full bg-primary px-3 py-1 text-xs">{film.year}</span>

          {watchedEvent?.rewatch && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
              Rewatch
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

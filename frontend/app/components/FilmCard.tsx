import Image from 'next/image';
import type { UserFilm, WatchedEvent } from '@/types/statistics';
import { getPosterUrl } from '@/utils/tmdb';

export default function FilmCard({
  film,
  watchedEvent,
}: {
  film: UserFilm;
  watchedEvent: WatchedEvent | null;
}) {
  const posterUrl = getPosterUrl(film.posterPath, 'w342');

  const watchedDate = watchedEvent?.date
    ? new Date(`${watchedEvent.date}T12:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article className="group min-w-0">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden border border-border bg-surface">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={film.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <span className="font-serif text-lg text-muted">{film.name}</span>
          </div>
        )}

        {/* Poster footer */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-3 pt-12">
          <p className="line-clamp-2 font-serif text-lg leading-tight text-white">{film.name}</p>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-white/70">{film.year}</p>
        </div>
      </div>

      {/* Diary details */}
      <div className="border-b border-border py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
              {watchedEvent?.rewatch ? 'Rewatched' : 'Screened'}
            </p>

            <p className="mt-1 text-xs text-muted">{watchedDate ?? 'Date not recorded'}</p>
          </div>

          {watchedEvent?.rating != null && (
            <span className="shrink-0 font-mono text-xs text-accent">★ {watchedEvent.rating}</span>
          )}
        </div>
      </div>
    </article>
  );
}

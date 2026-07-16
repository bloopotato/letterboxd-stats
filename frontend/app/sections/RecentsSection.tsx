import { UserFilm } from '@/types/statistics';
import FilmCard from '@/app/components/FilmCard';

function getWatchedEvents(films: UserFilm[]) {
  return films.flatMap((film) =>
    film.watchedEvents.map((event) => ({
      film,
      watchedEvent: event,
    }))
  );
}

function getRecentWatchedEvents(films: UserFilm[], limit = 4) {
  return getWatchedEvents(films)
    .sort(
      (a, b) => new Date(b.watchedEvent.date).getTime() - new Date(a.watchedEvent.date).getTime()
    )
    .slice(0, limit);
}

export default function RecentsSection({ importedItems }: { importedItems: UserFilm[] }) {
  const recents = getRecentWatchedEvents(importedItems);
  return (
    <div>
      <h1>Your Recents</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {recents.map(({ film, watchedEvent }) => (
          <FilmCard
            key={`${film.tmdbId}-${watchedEvent.date}`}
            film={film}
            watchedEvent={watchedEvent}
          />
        ))}
      </div>
    </div>
  );
}

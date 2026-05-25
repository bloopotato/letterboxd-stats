import { NextResponse } from 'next/server';
import type {
  EnrichedLookupEntry,
  LetterboxdLookupEntry,
  TMDBCountryRow,
  TMDBGenreRow,
  TMDBLanguageRow,
  TMDBMovieDetails,
  TMDBSearchResponse,
  TMDBProductionCompanyRow,
  TMDBMovieRow,
} from '@/utils/data/types';
import { bulkSearchMovies } from '@/lib/lookup';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_REQUEST_SPACING_MS = 275;
let lastTmdbRequestAt = 0;

async function fetchExistingMoviesFromSupabase(films: LetterboxdLookupEntry[]) {
  const lookup = new Map<string, number>();
  const rows = await bulkSearchMovies(films);

  for (const row of rows) {
    const year = row.release_date ? new Date(row.release_date).getFullYear() : undefined;
    const key = movieKey(row.title, year);
    if (!key) continue;
    lookup.set(key, row.id);
  }

  return lookup;
}

async function waitForTmdbSlot() {
  const now = Date.now();
  const elapsed = now - lastTmdbRequestAt;
  if (elapsed < TMDB_REQUEST_SPACING_MS) {
    await new Promise((resolve) => setTimeout(resolve, TMDB_REQUEST_SPACING_MS - elapsed));
  }

  lastTmdbRequestAt = Date.now();
}

async function fetchFromTmdb(title: string, year?: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) return null;
  const params = new URLSearchParams({ query: title });
  if (year) params.set('year', String(year));
  const tmdbHeaders = {
    Authorization: `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json;charset=utf-8',
  };
  await waitForTmdbSlot();
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
    headers: tmdbHeaders,
  });
  if (!res.ok) return null;
  const data: TMDBSearchResponse = await res.json();
  const first = data.results?.[0] ?? null;
  if (!first) return null;
  await waitForTmdbSlot();
  const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${first.id}`, {
    headers: tmdbHeaders,
  });
  if (!detailsRes.ok) return null;
  return (await detailsRes.json()) as TMDBMovieDetails;
}

async function upsertSupabaseRow<T extends object>(table: string, row: T, conflictTarget?: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (conflictTarget) {
    url.searchParams.set('on_conflict', conflictTarget);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${message}`);
  }
}

function movieKey(title: unknown, year?: number) {
  if (typeof title !== 'string') return null;

  const trimmed = title.trim();
  if (!trimmed) return null;

  return `${trimmed.toLowerCase()}|${year ?? ''}`;
}

async function upsertMovieGraph(movie: TMDBMovieDetails) {
  const movieRow: TMDBMovieRow = {
    id: movie.id,
    imdb_id: movie.imdb_id,
    title: movie.title,
    original_title: movie.original_title,
    original_language: movie.original_language,
    overview: movie.overview,
    release_date: movie.release_date,
    runtime: movie.runtime,
    popularity: movie.popularity,
    poster_path: movie.poster_path,
    status: movie.status,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    raw: movie,
  };

  await upsertSupabaseRow('tmdb_movies', movieRow, 'id');

  await Promise.all(
    movie.genres.map((genre) => upsertSupabaseRow('tmdb_genres', genre as TMDBGenreRow, 'id'))
  );
  await Promise.all(
    movie.genres.map((genre) =>
      upsertSupabaseRow(
        'tmdb_movie_genres',
        { movie_id: movie.id, genre_id: genre.id },
        'movie_id,genre_id'
      )
    )
  );

  await Promise.all(
    movie.spoken_languages.map((language) =>
      upsertSupabaseRow('tmdb_languages', language as TMDBLanguageRow, 'iso_639_1')
    )
  );
  await Promise.all(
    movie.spoken_languages.map((language) =>
      upsertSupabaseRow(
        'tmdb_movie_languages',
        {
          movie_id: movie.id,
          language_code: language.iso_639_1,
        },
        'movie_id,language_code'
      )
    )
  );

  await Promise.all(
    movie.production_countries.map((country) =>
      upsertSupabaseRow('tmdb_countries', country as TMDBCountryRow, 'iso_3166_1')
    )
  );
  await Promise.all(
    movie.production_countries.map((country) =>
      upsertSupabaseRow(
        'tmdb_movie_countries',
        {
          movie_id: movie.id,
          country_code: country.iso_3166_1,
        },
        'movie_id,country_code'
      )
    )
  );

  await Promise.all(
    movie.production_companies.map((company) =>
      upsertSupabaseRow('tmdb_production_companies', company as TMDBProductionCompanyRow, 'id')
    )
  );
  await Promise.all(
    movie.production_companies.map((company) =>
      upsertSupabaseRow(
        'tmdb_movie_production_companies',
        {
          movie_id: movie.id,
          company_id: company.id,
        },
        'movie_id,company_id'
      )
    )
  );
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing Supabase server configuration. Set SUPABASE_SERVICE_ROLE_KEY in the server environment.',
        },
        { status: 500 }
      );
    }

    if (!TMDB_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing TMDB_API_KEY in the server environment. The enrich route cannot look up movies without it.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const films: LetterboxdLookupEntry[] = body.items || body.films || [];

    // Bulk lookup in supabase
    const existingMovies = await fetchExistingMoviesFromSupabase(films);
    console.log(existingMovies)

    const enriched: EnrichedLookupEntry[] = [];

    for (const film of films) {
      const key = movieKey(film.title, film.year);

      if (!key) {
        enriched.push({
          ...film,
          tmdbCached: false,
          tmdbId: null,
          tmdb: null,
        });
        continue;
      }

      const existingMovieId = existingMovies.get(key);

      if (existingMovieId) {
        enriched.push({
          ...film,
          tmdbCached: true,
          tmdbId: existingMovieId,
          tmdb: null,
        });
        continue;
      }

      const tmdb = await fetchFromTmdb(film.title, film.year);
      if (tmdb) {
        await upsertMovieGraph(tmdb);
      }

      enriched.push({
        ...film,
        tmdbCached: Boolean(tmdb),
        tmdbId: tmdb?.id ?? null,
        tmdb,
      });
    }

    return NextResponse.json({ ok: true, results: enriched });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

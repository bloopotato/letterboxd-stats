import { NextResponse } from 'next/server';
import type { TMDBSearchResponse, TMDBProductionCompanyRow } from '@/utils/data/types';
import { bulkSearchMovies } from '@/lib/lookup';
import {
  BulkMovieLookupResult,
  MovieLookup,
  TMDBMovieDetails,
  TMDBMovieRow,
  TMDBCountryRow,
  TMDBGenreRow,
  TMDBLanguageRow,
} from '@/types/database';
import { UserFilm } from '@/types/statistics';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_REQUEST_SPACING_MS = 275;
const TMDB_LOOKUP_CONCURRENCY = 4;
let lastTmdbRequestAt = 0;
let tmdbSlotQueue: Promise<void> = Promise.resolve();

type ExistingMovieLookup = {
  byUri: Map<string, BulkMovieLookupResult>;
  byTitle: Map<string, BulkMovieLookupResult>;
  byFilmKey: Map<string, BulkMovieLookupResult>;
};

function normaliseUri(uri: string | null | undefined): string | null {
  if (typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase().replace(/\/$/, '');
}

function filmKeyFromParts(title: string, year?: number): string | null {
  const titleKey = movieKey(title);
  if (!titleKey) return null;
  return `${titleKey}::${year ?? 'null'}`;
}

async function fetchExistingFilms(films: MovieLookup[]): Promise<ExistingMovieLookup> {
  const rows = await bulkSearchMovies(films);
  // console.log('bulkSearchMovies returned rows:', rows);

  const byUri = new Map<string, BulkMovieLookupResult>();
  const byTitle = new Map<string, BulkMovieLookupResult>();
  const byFilmKey = new Map<string, BulkMovieLookupResult>();

  rows.forEach((row, index) => {
    if (!row?.id) return;

    const baseRow: BulkMovieLookupResult = {
      id: row.id,
      title: row.title,
      original_title: row.original_title,
      release_date: row.release_date,
      poster_path: row.poster_path,
      vote_average: row.vote_average,
      runtime: row.runtime,
      letterboxd_uri: row.letterboxd_uri,
      matched_by: row.matched_by,
    };

    const rowUriKey = normaliseUri(row.letterboxd_uri);
    if (rowUriKey) {
      byUri.set(rowUriKey, baseRow);
    }

    const titleKey = movieKey(row.title);
    if (titleKey) {
      byTitle.set(titleKey, baseRow);
    }

    const sourceFilm = films[index];
    const sourceFilmKey = sourceFilm ? filmKeyFromParts(sourceFilm.title, sourceFilm.year) : null;
    if (sourceFilmKey) {
      byFilmKey.set(sourceFilmKey, baseRow);
    }
  });

  return { byUri, byTitle, byFilmKey };
}

async function updateMovieLetterboxdUri(movieId: number, letterboxdUri: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/tmdb_movies`);
  url.searchParams.set('id', `eq.${movieId}`);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      letterboxd_uri: letterboxdUri,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

type TmdbUpsertCandidate = {
  film: UserFilm;
  tmdb: TMDBMovieDetails;
  movie: TMDBMovieRow;
};

async function waitForTmdbSlot() {
  const slotPromise = tmdbSlotQueue.then(async () => {
    const now = Date.now();
    const elapsed = now - lastTmdbRequestAt;
    if (elapsed < TMDB_REQUEST_SPACING_MS) {
      await new Promise((resolve) => setTimeout(resolve, TMDB_REQUEST_SPACING_MS - elapsed));
    }

    lastTmdbRequestAt = Date.now();
  });

  tmdbSlotQueue = slotPromise.catch(() => undefined);
  await slotPromise;
}

function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function fetchFromTmdb(title: string, year?: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) return null;

  const params = new URLSearchParams({ query: title });

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
  const results = data.results ?? [];

  const q = normalise(title);

  const scored = results.map((r) => {
    const name = normalise(r.title);

    let score = 0;

    // 1. exact match (very strong)
    if (name === q) score += 100;
    // 2. contains match
    else if (name.includes(q) || q.includes(name)) score += 50;

    // 3. fuzzy-ish word overlap
    const qWords = q.split('');
    const rWords = name.split('');
    const overlap = qWords.filter((c) => rWords.includes(c)).length;
    score += overlap;

    // 4. optional year bonus (VERY weak signal)
    if (year && r.release_date) {
      const diff = Math.abs(new Date(r.release_date).getFullYear() - year);

      score += Math.max(0, 10 - diff); // small bonus only
    }

    // 5. popularity tie-breaker
    score += (r.popularity ?? 0) * 0.01;

    return { ...r, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];

  if (!best) return null;

  await waitForTmdbSlot();

  const detailsRes = await fetch(
    `https://api.themoviedb.org/3/movie/${best.id}?append_to_response=credits`,
    {
      headers: tmdbHeaders,
    }
  );

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

function movieKey(title: unknown) {
  if (typeof title !== 'string') return null;
  return normalise(title);
}

function safeDate(date: string | null | undefined): string | null {
  if (!date || date.trim() === '') return null;
  return date;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  if (!items.length) return;

  let index = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (index < items.length) {
        const currentIndex = index;
        index += 1;
        await worker(items[currentIndex]);
      }
    })
  );
}

async function upsertMovieGraph(movie: TMDBMovieDetails) {
  const movieRow: TMDBMovieRow = {
    id: movie.id,
    imdb_id: movie.imdb_id,
    title: movie.title,
    original_title: movie.original_title,
    original_language: movie.original_language,
    overview: movie.overview,
    release_date: safeDate(movie.release_date),
    runtime: movie.runtime,
    popularity: movie.popularity,
    poster_path: movie.poster_path,
    status: movie.status,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    letterboxd_uri: movie.letterboxd_uri ?? null,
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

  // Upsert people (cast + crew) and credits into normalized tables
  const castMembers = movie.credits?.cast ?? [];
  const crewMembers = movie.credits?.crew ?? [];

  const filteredCast = castMembers.filter(
    (c) => c.known_for_department === 'Acting' && typeof c.order === 'number' && c.order <= 20
  );

  const filteredDirectors = crewMembers.filter((c) => c.job === 'Director');

  await Promise.all(
    filteredCast.map((c) =>
      upsertSupabaseRow(
        'tmdb_people',
        {
          id: c.id,
          name: c.name,
          profile_path: c.profile_path,
          known_for_department: 'Acting',
        },
        'id'
      )
    )
  );

  await Promise.all(
    filteredDirectors.map((c) =>
      upsertSupabaseRow(
        'tmdb_people',
        {
          id: c.id,
          name: c.name,
          profile_path: c.profile_path,
          known_for_department: c.department ?? 'Directing',
        },
        'id'
      )
    )
  );

  await Promise.all(
    filteredCast.map((c) =>
      upsertSupabaseRow(
        'tmdb_credits',
        {
          movie_id: movie.id,
          person_id: c.id,
          department: 'Acting',
          job: '',
          character: c.character ?? '',
          cast_order: c.order ?? null,
        },
        'movie_id,person_id,job,character'
      )
    )
  );

  await Promise.all(
    filteredDirectors.map((c) =>
      upsertSupabaseRow(
        'tmdb_credits',
        {
          movie_id: movie.id,
          person_id: c.id,
          department: c.department ?? null,
          job: 'Director',
          character: '',
          cast_order: null,
        },
        'movie_id,person_id,job,character'
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
    const films: UserFilm[] = body.items ?? [];
    // console.log('Films: ', films);

    // ========== (1) Bulk lookup in supabase ==========
    const lookupInput: MovieLookup[] = films.map((f) => ({
      title: f.name,
      year: f.year,
      letterboxd_uri: f.letterboxdUri ?? null,
    }));
    const existingMovies = await fetchExistingFilms(lookupInput);

    const enriched: UserFilm[] = [];
    const missing: UserFilm[] = [];
    const tmdbUpserts: TmdbUpsertCandidate[] = [];
    const tmdbByKey = new Map<string, TMDBMovieDetails | null>();
    let uriMatchedCount = 0;
    let titleMatchedCount = 0;

    // ========== (2) Fill data from lookup ==========
    for (const film of films) {
      const uriKey = normaliseUri(film.letterboxdUri);
      const perFilmKey = filmKeyFromParts(film.name, film.year);
      const titleKey = movieKey(film.name);

      const match =
        (uriKey ? existingMovies.byUri.get(uriKey) : undefined) ??
        (perFilmKey ? existingMovies.byFilmKey.get(perFilmKey) : undefined) ??
        (titleKey ? existingMovies.byTitle.get(titleKey) : undefined);

      if (match) {
        if (uriKey && normaliseUri(match.letterboxd_uri) === uriKey) {
          uriMatchedCount += 1;
        } else {
          titleMatchedCount += 1;
        }

        if (uriKey && normaliseUri(match.letterboxd_uri) !== uriKey) {
          await updateMovieLetterboxdUri(match.id, film.letterboxdUri!.trim());
          match.letterboxd_uri = film.letterboxdUri!.trim();
          existingMovies.byUri.set(uriKey, match);
        }

        enriched.push({
          ...film,
          tmdbId: match.id,
          runtime: match.runtime ?? null,
          posterPath: match.poster_path ?? null,
          cached: true,
        });
      } else {
        enriched.push({
          ...film,
          tmdbId: null,
          runtime: null,
          posterPath: null,
          cached: false,
        });

        missing.push(film);
      }
    }

    // ========== (3) Fill missing data from TMDB ==========
    const uniqueMissingByKey = new Map<string, UserFilm>();
    for (const film of missing) {
      const key = movieKey(film.name);
      if (!key || uniqueMissingByKey.has(key)) continue;
      uniqueMissingByKey.set(key, film);
    }

    await runWithConcurrency(
      Array.from(uniqueMissingByKey.values()),
      TMDB_LOOKUP_CONCURRENCY,
      async (film) => {
        const tmdb = await fetchFromTmdb(film.name, film.year);
        const key = movieKey(film.name);
        const normalisedUri = normaliseUri(film.letterboxdUri);

        if (tmdb) {
          tmdb.letterboxd_uri = normalisedUri;

          if (key) {
            tmdbByKey.set(key, tmdb);
          }

          if (normalisedUri) {
            tmdbByKey.set(normalisedUri, tmdb);
          }

          const movieRow: TMDBMovieRow = {
            id: tmdb.id,
            imdb_id: tmdb.imdb_id,
            title: tmdb.title,
            original_title: tmdb.original_title,
            original_language: tmdb.original_language,
            overview: tmdb.overview,
            release_date: tmdb.release_date,
            runtime: tmdb.runtime,
            popularity: tmdb.popularity,
            poster_path: tmdb.poster_path,
            status: tmdb.status,
            vote_average: tmdb.vote_average,
            vote_count: tmdb.vote_count,
            letterboxd_uri: normalisedUri,
            raw: tmdb,
          };

          tmdbUpserts.push({
            film,
            tmdb,
            movie: movieRow,
          });

          await upsertMovieGraph(tmdb);
        } else if (key) {
          tmdbByKey.set(key, null);

          if (normalisedUri) {
            tmdbByKey.set(normalisedUri, null);
          }
        }
      }
    );

    // const fullResults: FullUserFilmResult[] = films.map((film) => {
    //   const key = movieKey(film.name);
    //   const uriKey = normaliseUri(film.letterboxdUri);
    //   const cached =
    //     (uriKey ? existingMovies.byUri.get(uriKey) : undefined) ??
    //     (key ? existingMovies.byTitle.get(key) : undefined) ??
    //     null;
    //   const tmdbFromUri = uriKey ? (tmdbByKey.get(uriKey) ?? null) : null;
    //   const tmdb = tmdbFromUri !== null ? tmdbFromUri : key ? (tmdbByKey.get(key) ?? null) : null;

    //   return {
    //     base: film,
    //     cached,
    //     tmdb,
    //   };
    // });

    const analytics = {
      inputCount: films.length,
      cachedCount: enriched.filter((entry) => entry.cached).length,
      missingCount: missing.length,
      tmdbMatchedCount: tmdbUpserts.length,
      uriMatchedCount,
      titleMatchedCount,
      filmSummary: films.map((film) => ({
        title: film.name,
        year: film.year ?? null,
        cached: Boolean(
          (normaliseUri(film.letterboxdUri) &&
            existingMovies.byUri.get(normaliseUri(film.letterboxdUri)!)) ||
          (movieKey(film.name) && existingMovies.byTitle.get(movieKey(film.name)!))
        ),
      })),
    };

    console.log('lookup.analytics', {
      analytics,
      films: enriched,
      // fullResults,
      missing,
      tmdbUpserts,
    });

    return NextResponse.json({
      ok: true,
      films: enriched, // fullResults, tmdbUpserts,
      analytics,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

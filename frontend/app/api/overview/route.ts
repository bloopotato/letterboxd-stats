import { NextResponse } from 'next/server';
import type {
  OverviewStats,
  TMDBGenreRow,
  TMDBLanguageRow,
  TMDBMovieRow,
} from '@/utils/data/types';
import {LetterboxdLookupEntryTemp} from "@/types/letterboxd";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type OverviewInputItem = Pick<LetterboxdLookupEntryTemp, 'rating'> & {
  tmdbId?: number | null;
};

type MovieGenreRow = {
  movie_id: number;
  genre_id: number;
};

type MovieLanguageRow = {
  movie_id: number;
  language_code: string;
};

async function fetchSupabaseRows<T>(table: string, query: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    },
  });
  console.log(`Supabase fetch for ${table}${query}:`, response);

  if (!response.ok) return [];
  return (await response.json()) as T[];
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topItems(counts: Map<string, number>, limit = 5) {
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: OverviewInputItem[] = body.items || [];
    const tmdbIds = Array.from(
      new Set(items.map((item) => item.tmdbId).filter((id): id is number => typeof id === 'number'))
    );
    const ratings = items
      .map((item) => item.rating)
      .filter((rating): rating is number => typeof rating === 'number');

    if (!tmdbIds.length) {
      return NextResponse.json({
        ok: true,
        stats: {
          watchedCount: items.length,
          averageRating: average(ratings),
          averageRuntime: null,
          topGenres: [],
          topLanguages: [],
        },
      });
    }

    const idsQuery = `?select=id,runtime,imdb_id&id=in.(${tmdbIds.join(',')})`;
    const [movies, genres, movieGenres, languages, movieLanguages] = await Promise.all([
      fetchSupabaseRows<TMDBMovieRow>('tmdb_movies', idsQuery),
      fetchSupabaseRows<TMDBGenreRow>('tmdb_genres', '?select=id,name'),
      fetchSupabaseRows<MovieGenreRow>(
        'tmdb_movie_genres',
        `?select=movie_id,genre_id&movie_id=in.(${tmdbIds.join(',')})`
      ),
      fetchSupabaseRows<TMDBLanguageRow>('tmdb_languages', '?select=iso_639_1,english_name,name'),
      fetchSupabaseRows<MovieLanguageRow>(
        'tmdb_movie_languages',
        `?select=movie_id,language_code&movie_id=in.(${tmdbIds.join(',')})`
      ),
    ]);

    const movieById = new Map<number, TMDBMovieRow>(movies.map((movie) => [movie.id, movie]));
    const genreById = new Map<number, string>(genres.map((genre) => [genre.id, genre.name]));
    const languageByCode = new Map<string, string>(
      languages.map((language) => [language.iso_639_1, language.name])
    );

    const genreCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    const runtimeValues: number[] = [];

    for (const movieId of tmdbIds) {
      const movie = movieById.get(movieId);
      if (!movie) continue;

      if (movie.runtime != null) runtimeValues.push(movie.runtime);

      for (const relation of movieGenres) {
        if (relation.movie_id !== movie.id) continue;
        const genreName = genreById.get(relation.genre_id);
        if (!genreName) continue;
        genreCounts.set(genreName, (genreCounts.get(genreName) ?? 0) + 1);
      }

      for (const relation of movieLanguages) {
        if (relation.movie_id !== movie.id) continue;
        const languageName = languageByCode.get(relation.language_code);
        if (!languageName) continue;
        languageCounts.set(languageName, (languageCounts.get(languageName) ?? 0) + 1);
      }
    }

    const stats: OverviewStats = {
      watchedCount: items.length,
      averageRating: average(ratings),
      averageRuntime: average(runtimeValues),
      topGenres: topItems(genreCounts),
      topLanguages: topItems(languageCounts),
    };

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// utils/tmdb.ts

export function getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' = 'w342') {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : '/default-poster.jpg';
}

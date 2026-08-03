create or replace function search_movies_bulk(entries jsonb)
returns table (
  input_title text,
  input_letterboxd_uri text,
  id bigint,
  title text,
  original_title text,
  release_date date,
  poster_path text,
  vote_average double precision,
  letterboxd_uri text,
  matched_by text
)
language sql
as $$
select
    e->>'title' as input_title,
    nullif(trim(e->>'letterboxd_uri'), '') as input_letterboxd_uri,
    m.id,
    m.title,
    m.original_title,
    m.release_date,
    m.poster_path,
    m.vote_average,
    m.letterboxd_uri,
    m.matched_by
from jsonb_array_elements(entries) as e
    left join lateral (
    select
      m.id,
      m.title,
      m.original_title,
      m.release_date,
      m.poster_path,
      m.vote_average,
      m.letterboxd_uri,
      case
        when nullif(trim(e->>'letterboxd_uri'), '') is not null
             and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
          then 'uri'
        else 'title_year'
      end as matched_by
    from tmdb_movies m
    where
      (
        nullif(trim(e->>'letterboxd_uri'), '') is not null
        and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
      )
      or (
        m.title ilike '%' || (e->>'title') || '%'
        and (
          e->>'year' is null
          or extract(year from m.release_date) = (e->>'year')::int
        )
      )
    order by
      case
        when nullif(trim(e->>'letterboxd_uri'), '') is not null
             and m.letterboxd_uri = nullif(trim(e->>'letterboxd_uri'), '')
          then 0
        else 1
      end,
      similarity(m.title, e->>'title') desc
    limit 1
    ) m on true;
$$;


CREATE OR REPLACE FUNCTION top_people_for_movies(
  movie_ids bigint[]
)
RETURNS TABLE (
  category text,
  id bigint,
  name text,
  profile_path text,
  count bigint,
  movies jsonb
)
LANGUAGE sql
STABLE
AS $$
WITH filtered_movies AS (
  SELECT m.id
  FROM tmdb_movies m
  WHERE m.id = ANY(movie_ids)
),

cast_people AS (
  SELECT
    p.id,
    p.name,
    p.profile_path,
    COUNT(DISTINCT c.movie_id)::bigint AS count
  FROM tmdb_credits c
  JOIN filtered_movies fm ON fm.id = c.movie_id
  JOIN tmdb_people p ON p.id = c.person_id
  WHERE c.department = 'Acting'
  GROUP BY p.id, p.name, p.profile_path
  ORDER BY count DESC, p.name ASC
  LIMIT 50
),

director_people AS (
  SELECT
    p.id,
    p.name,
    p.profile_path,
    COUNT(DISTINCT c.movie_id)::bigint AS count
  FROM tmdb_credits c
  JOIN filtered_movies fm ON fm.id = c.movie_id
  JOIN tmdb_people p ON p.id = c.person_id
  WHERE c.department = 'Directing'
    AND c.job = 'Director'
  GROUP BY p.id, p.name, p.profile_path
  ORDER BY count DESC, p.name ASC
  LIMIT 50
)

SELECT
  'cast'::text AS category,
  cp.id,
  cp.name,
  cp.profile_path,
  cp.count,
  jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'year', EXTRACT(YEAR FROM m.release_date)::int,
      'letterboxdUri', m.letterboxd_uri
    )
    ORDER BY m.release_date DESC
  ) AS movies
FROM cast_people cp
JOIN tmdb_credits c
  ON c.person_id = cp.id
 AND c.department = 'Acting'
JOIN tmdb_movies m
  ON m.id = c.movie_id
JOIN filtered_movies fm
  ON fm.id = m.id
GROUP BY cp.id, cp.name, cp.profile_path, cp.count

UNION ALL

SELECT
  'director'::text AS category,
  dp.id,
  dp.name,
  dp.profile_path,
  dp.count,
  jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'year', EXTRACT(YEAR FROM m.release_date)::int,
      'letterboxdUri', m.letterboxd_uri
    )
    ORDER BY m.release_date DESC
  ) AS movies
FROM director_people dp
JOIN tmdb_credits c
  ON c.person_id = dp.id
 AND c.department = 'Directing'
 AND c.job = 'Director'
JOIN tmdb_movies m
  ON m.id = c.movie_id
JOIN filtered_movies fm
  ON fm.id = m.id
GROUP BY dp.id, dp.name, dp.profile_path, dp.count

ORDER BY
  category,
  count DESC,
  name ASC;
$$;
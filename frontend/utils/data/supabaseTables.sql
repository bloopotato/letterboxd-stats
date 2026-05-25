drop table if exists movie_genres cascade;
drop table if exists movie_countries cascade;
drop table if exists genres cascade;
drop table if exists countries cascade;
drop table if exists tmdb_movies cascade;

-- Core TMDB movie table for the detailed movie payload.
create table if not exists public.tmdb_movies (
	id bigint primary key,
    imdb_id text unique,
	title text not null,
	original_title text not null,
	original_language text not null,
	overview text not null default '',
	popularity double precision not null default 0,
	poster_path text,
	release_date date,
	runtime integer,
	status text not null,
	vote_average double precision not null default 0,
	vote_count integer not null default 0,
	raw jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.tmdb_genres (
	id integer primary key,
	name text not null unique
);

create table if not exists public.tmdb_movie_genres (
	movie_id bigint not null references public.tmdb_movies (id) on delete cascade,
	genre_id integer not null references public.tmdb_genres (id) on delete cascade,
	primary key (movie_id, genre_id)
);

create table if not exists public.tmdb_production_companies (
	id bigint primary key,
	name text not null,
	logo_path text,
	origin_country text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.tmdb_movie_production_companies (
	movie_id bigint not null references public.tmdb_movies (id) on delete cascade,
	company_id bigint not null references public.tmdb_production_companies (id) on delete cascade,
	primary key (movie_id, company_id)
);

create table if not exists public.tmdb_countries (
	iso_3166_1 text primary key,
	name text not null
);

create table if not exists public.tmdb_movie_countries (
	movie_id bigint not null references public.tmdb_movies (id) on delete cascade,
	country_code text not null references public.tmdb_countries (iso_3166_1) on delete cascade,
	primary key (movie_id, country_code)
);

create table if not exists public.tmdb_languages (
	iso_639_1 text primary key,
	english_name text not null,
	name text not null
);

create table if not exists public.tmdb_movie_languages (
	movie_id bigint not null references public.tmdb_movies (id) on delete cascade,
	language_code text not null references public.tmdb_languages (iso_639_1) on delete cascade,
	primary key (movie_id, language_code)
);

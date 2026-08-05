-- ============================================================================
--  Portfolio content schema
--  Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--  Safe to re-run: everything is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  Who is allowed to write
--  A row here is the ONLY thing that grants write access. Signing up is not
--  enough — the user id has to be inserted here (see the bottom of this file).
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Security definer so the policies below can consult the table without
-- recursing through its own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
--  updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
--  Content tables
-- ---------------------------------------------------------------------------

-- Gallery: one row per astrophoto, body is markdown/MDX.
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  object text not null default '',
  tag text,
  alt text not null default '',
  body text not null default '',
  -- Image URLs (Supabase Storage public URLs, or /photos/... for local files)
  thumb_url text not null,
  medium_url text not null,
  full_url text not null,
  -- Extra frames: [{ medium_url, full_url, caption }]
  frames jsonb not null default '[]'::jsonb,
  -- { src, label, credit, url } for the comparison slider
  reference jsonb,
  gear jsonb not null default '{}'::jsonb,
  acquisition jsonb not null default '{}'::jsonb,
  captured_on text,
  location text,
  -- Shooting site, plotted on the gallery map. Null = not shown on the map.
  latitude double precision,
  longitude double precision,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  url text not null default '#',
  tags text[] not null default '{}',
  year text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text not null default '',
  image_url text,
  min_read integer not null default 3,
  published_on date not null default current_date,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Paper', 'Preprint', 'Thesis', 'Award')),
  title text not null,
  detail text not null default '',
  published_on date,
  url text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Free-form page copy: about, gallery intro, hero, CV, FAQ …
-- `body` is markdown, `data` is whatever structured extras the page needs.
create table if not exists public.pages (
  key text primary key,
  title text not null default '',
  description text not null default '',
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The CV / résumé: one row, the whole document as JSON so sections can be
-- added without a migration. `key` allows a future second variant.
create table if not exists public.cv_documents (
  key text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Migrations for tables that already exist
--  (`create table if not exists` above is a no-op once a table is there, so
--  columns added after the first run need their own statement.)
-- ---------------------------------------------------------------------------
alter table public.gallery_photos add column if not exists latitude double precision;
alter table public.gallery_photos add column if not exists longitude double precision;

-- ---------------------------------------------------------------------------
--  Triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['gallery_photos', 'projects', 'posts', 'publications', 'pages', 'cv_documents'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  Row level security
--  Anonymous visitors: read published rows only.
--  Admins (a row in public.admins): full write access.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['gallery_photos', 'projects', 'posts', 'publications'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "public reads published" on public.%I', t);
    execute format(
      'create policy "public reads published" on public.%I
       for select to anon, authenticated using (published = true or public.is_admin())', t);

    execute format('drop policy if exists "admins insert" on public.%I', t);
    execute format(
      'create policy "admins insert" on public.%I
       for insert to authenticated with check (public.is_admin())', t);

    execute format('drop policy if exists "admins update" on public.%I', t);
    execute format(
      'create policy "admins update" on public.%I
       for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);

    execute format('drop policy if exists "admins delete" on public.%I', t);
    execute format(
      'create policy "admins delete" on public.%I
       for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

alter table public.cv_documents enable row level security;

drop policy if exists "public reads cv" on public.cv_documents;
create policy "public reads cv" on public.cv_documents
  for select to anon, authenticated using (true);

drop policy if exists "admins write cv" on public.cv_documents;
create policy "admins write cv" on public.cv_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.pages enable row level security;

drop policy if exists "public reads pages" on public.pages;
create policy "public reads pages" on public.pages
  for select to anon, authenticated using (true);

drop policy if exists "admins write pages" on public.pages;
create policy "admins write pages" on public.pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
--  Indexes
-- ---------------------------------------------------------------------------
create index if not exists gallery_photos_order_idx on public.gallery_photos (sort_order, created_at desc);
create index if not exists projects_order_idx on public.projects (sort_order, created_at desc);
create index if not exists posts_date_idx on public.posts (published_on desc);
create index if not exists publications_order_idx on public.publications (sort_order, published_on desc);

-- ---------------------------------------------------------------------------
--  Storage bucket for uploaded photos
--  Public read (the site shows them), writes restricted to admins.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos are publicly readable" on storage.objects;
create policy "photos are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos');

drop policy if exists "admins upload photos" on storage.objects;
create policy "admins upload photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and public.is_admin());

drop policy if exists "admins update photos" on storage.objects;
create policy "admins update photos" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and public.is_admin());

drop policy if exists "admins delete photos" on storage.objects;
create policy "admins delete photos" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_admin());

-- ============================================================================
--  LAST STEP — grant yourself admin
--
--  1. Dashboard → Authentication → Users → "Add user" → your email + a strong
--     password (tick "Auto Confirm User").
--  2. Copy the new user's UID and run:
--
--       insert into public.admins (user_id, email)
--       values ('<paste-uid-here>', 'shahadatw6@gmail.com')
--       on conflict (user_id) do nothing;
--
--  3. Dashboard → Authentication → Providers → disable "Enable sign ups"
--     so nobody else can ever create an account.
-- ============================================================================

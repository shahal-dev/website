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
  one_of_one_available boolean not null default true,
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

-- Customer orders are private. Visitors can submit an order request, but only
-- admins can read customer details or change its status.
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  country text not null,
  address text,
  notes text,
  payment_transaction_id text not null check (char_length(payment_transaction_id) between 4 and 120),
  items jsonb not null,
  currency text not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_orders_items_check check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20)
);

-- ---------------------------------------------------------------------------
--  Migrations for tables that already exist
--  (`create table if not exists` above is a no-op once a table is there, so
--  columns added after the first run need their own statement.)
-- ---------------------------------------------------------------------------
alter table public.gallery_photos add column if not exists latitude double precision;
alter table public.gallery_photos add column if not exists longitude double precision;
alter table public.gallery_photos add column if not exists one_of_one_available boolean not null default true;
alter table public.shop_orders add column if not exists currency text not null default 'BDT';
alter table public.shop_orders add column if not exists subtotal numeric(12, 2) not null default 0 check (subtotal >= 0);
alter table public.shop_orders add column if not exists payment_transaction_id text;

-- ---------------------------------------------------------------------------
--  Triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['gallery_photos', 'projects', 'posts', 'publications', 'pages', 'cv_documents', 'shop_orders'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- The public API permits order submission, so calculate prices again in the
-- database. Direct REST inserts cannot choose their own item prices or total.
create or replace function public.price_shop_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare item jsonb;
  product record;
  format_name text;
  image_slug text;
  quantity_value integer;
  unit_price numeric(10, 2);
  normalized jsonb := '[]'::jsonb;
  seen text[] := array[]::text[];
  amount numeric(12, 2) := 0;
begin
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) not between 1 and 20 then
    raise exception 'Order must contain 1 to 20 items';
  end if;
  for item in select value from jsonb_array_elements(new.items) loop
    image_slug := item->>'slug';
    format_name := item->>'format';
    if image_slug is null or format_name is null or coalesce(item->>'size', '') <> '24 in long side (short side varies)'
      or coalesce(item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Invalid order item';
    end if;
    quantity_value := (item->>'quantity')::integer;
    if quantity_value < 1 or quantity_value > 20 or (format_name = 'one_of_one' and quantity_value <> 1)
      or (image_slug || ':' || format_name) = any(seen) then
      raise exception 'Invalid item quantity or duplicate';
    end if;
    seen := array_append(seen, image_slug || ':' || format_name);
    select title, one_of_one_available into product from public.gallery_photos
    where slug = image_slug and published = true;
    if not found then raise exception 'Image unavailable: %', image_slug; end if;
    unit_price := case format_name
      when 'print' then 4000
      when 'framed' then 6000
      when 'one_of_one' then 10000
      else null
    end;
    if unit_price is null or (format_name = 'one_of_one' and not product.one_of_one_available) then
      raise exception 'Format unavailable: %', format_name;
    end if;
    normalized := normalized || jsonb_build_array(jsonb_build_object(
      'slug', image_slug, 'title', product.title, 'format', format_name,
      'size', item->>'size', 'quantity', quantity_value,
      'unit_price', unit_price, 'line_total', unit_price * quantity_value
    ));
    amount := amount + unit_price * quantity_value;
  end loop;
  new.items := normalized;
  new.currency := 'BDT';
  new.subtotal := amount;
  return new;
end;
$$;

drop trigger if exists price_shop_order_on_insert on public.shop_orders;
create trigger price_shop_order_on_insert before insert on public.shop_orders
for each row execute function public.price_shop_order();

-- Confirming an order claims its one of one copies. The row update makes
-- concurrent confirmations for the same photo fail rather than oversell it.
create or replace function public.claim_one_of_one()
returns trigger language plpgsql security definer set search_path = public as $$
declare item jsonb;
  claimed integer;
begin
  if new.status in ('confirmed', 'completed') and old.status not in ('confirmed', 'completed') then
    for item in select value from jsonb_array_elements(new.items) loop
      if item->>'format' = 'one_of_one' then
        update public.gallery_photos
        set one_of_one_available = false
        where slug = item->>'slug' and one_of_one_available = true;
        get diagnostics claimed = row_count;
        if claimed <> 1 then
          raise exception 'One of one copy is no longer available: %', item->>'slug';
        end if;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists claim_one_of_one_on_confirm on public.shop_orders;
create trigger claim_one_of_one_on_confirm before update of status on public.shop_orders
for each row execute function public.claim_one_of_one();

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

alter table public.shop_orders enable row level security;
grant insert on public.shop_orders to anon;
grant insert, select, update on public.shop_orders to authenticated;

drop policy if exists "visitors submit orders" on public.shop_orders;
create policy "visitors submit orders" on public.shop_orders
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "admins read orders" on public.shop_orders;
create policy "admins read orders" on public.shop_orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update orders" on public.shop_orders;
create policy "admins update orders" on public.shop_orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

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
create index if not exists shop_orders_created_idx on public.shop_orders (created_at desc);
create unique index if not exists shop_orders_transaction_idx on public.shop_orders (payment_transaction_id) where payment_transaction_id is not null;

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

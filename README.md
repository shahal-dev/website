# knowshahal

Personal site of **MD Shahadat Hossain Shahal** — research assistant at the
Center for Astronomy, Space Science and Astrophysics (CASSA), machine learning
for radio astronomy, and astrophotography.

Built with Nuxt 4, Nuxt UI and Nuxt Content, with Supabase behind an admin area
for editing everything without touching the code.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm lint         # eslint
```

## What's where

| Path | What it is |
| --- | --- |
| `content/` | Markdown/YAML content — also the fallback when Supabase is unavailable |
| `content/cv.yml` | The CV that feeds the About page and both PDF downloads |
| `app/pages/` | Public pages, plus `admin/` (private) and `cv/` (print views) |
| `server/api/content/` | Reads Supabase, falls back to `content/` |
| `supabase/schema.sql` | Tables, row level security, storage bucket |
| `scripts/seed-supabase.mjs` | Copies `content/` into Supabase (gallery excluded — it's database-only) |

## Adding an astrophoto

The gallery lives entirely in Supabase. Go to `/admin/gallery` → **New photo**,
upload one image, and the browser generates the three versions — 400 px
thumbnail, 1600 px display, full resolution — plus `metadata.json`, and uploads
them straight to Supabase Storage. Extra carousel frames and a professional
reference frame for the comparison slider work the same way.

## Admin and deployment

See [`SETUP.md`](SETUP.md) — database schema, admin account, environment
variables, seeding, and the Vercel deploy.

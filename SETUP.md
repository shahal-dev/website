# Setup

The site runs fine with no database — every page falls back to the files in
`content/`. Connecting Supabase adds the admin area at `/admin`, where you can
edit and publish everything without touching the repository.

---

## 1. Database

Supabase dashboard → **SQL Editor** → New query → paste all of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

That creates the content tables, the `photos` storage bucket, and the row level
security policies. It's idempotent, so re-running it is harmless.

## 2. Your admin account

1. **Authentication → Users → Add user.** Your email, a long unique password,
   and tick *Auto Confirm User*.
2. Copy the new user's **UID**, then run in the SQL editor:

   ```sql
   insert into public.admins (user_id, email)
   values ('<paste-uid>', 'shahadatw6@gmail.com')
   on conflict (user_id) do nothing;
   ```

   Being signed in is *not* enough to write anything — a row in `admins` is what
   grants access, and every table policy checks it.

3. **Authentication → Providers → Email**: turn **off** "Enable sign ups".
   Now nobody can create an account, ever.
4. Optional but recommended: **Authentication → Multi-Factor** → enable TOTP,
   then add an authenticator app to your account.

## 3. Environment variables

From **Project Settings → API**:

| Variable | Where | Value |
| --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | Vercel + `.env` | Project URL |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **local `.env` only** | `service_role` key |

The service-role key bypasses all security rules. It is only used by the
one-off seed script below — never add it to Vercel, and never let it reach the
browser.

`.env` is gitignored. `.env.example` shows the shape.

## 4. Move the current content into the database (once)

```bash
pnpm seed            # add --dry-run first to see what it would do
```

This uploads `public/photos/**` to the `photos` storage bucket and copies every
photo, project, post, publication and page into Supabase. Re-running it upserts
by slug, so it won't create duplicates.

After seeding, the site reads from Supabase and the files in `content/` are just
a fallback for when the database is unreachable.

## 5. Deploy on Vercel

Import the repo — Vercel detects Nuxt and needs no extra configuration. Add
`NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_ANON_KEY` under
**Settings → Environment Variables** (Production *and* Preview), then redeploy.

`render.yaml` is still in the repo if you'd rather host on Render; it works
either way.

---

## Using the admin

Go to `/admin` (it isn't linked from anywhere and is excluded from search
engines). Sign in with the account from step 2.

- **Gallery** — upload one image and the three versions (400 px thumbnail,
  1600 px display, full resolution) plus `metadata.json` are generated in your
  browser and uploaded straight to Supabase Storage. Add extra frames for the
  carousel, a professional reference frame for the comparison slider, gear and
  acquisition details, and the story in Markdown.
- **Projects / Blog / Publications** — the same pattern: list, edit, publish
  toggle, ordering.
- **CV** — every section of the résumé, with a per-entry switch for whether it
  belongs on the one-page version. Feeds the About page and both PDFs.
- **Pages** — the standing copy: About, gallery intro, homepage hero.

Everything saves to the database and appears on the site within a minute (the
content API caches for 60 seconds).

If Supabase is unreachable — or a table doesn't exist yet — the content API
logs a warning and serves the files in `content/` instead, so the public site
never goes down with the database.

### Security summary

- Writes require both a Supabase session **and** a row in `admins`; row level
  security enforces this in the database, not in the UI.
- The browser only ever holds the anon key. With no admin row it can read
  published content and nothing else.
- Storage: public read, admin-only write.
- `/admin` is client-rendered, `noindex, nofollow`, excluded from prerendering
  and from the sitemap.
- The login form backs off for 60 seconds after five failed attempts, on top of
  Supabase's own auth rate limiting.
- Uploads go browser → Supabase directly, so no image ever passes through the
  hosting platform's request limits.

### If you ever need to revoke access

`delete from public.admins where email = '…';` — that account can still sign in
but can no longer change anything.

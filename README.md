# APK Store

Installable PWA marketplace for APKs and other PWAs, built on Next.js 14 + Supabase.

## Setup in Termux

```bash
pkg install nodejs-lts git -y
cd apkstore
npm install
cp .env.local.example .env.local
```

Open `.env.local` and paste your **service role** key (Supabase Dashboard →
Settings → API → `service_role` secret). The URL and anon key are already
filled in — they point at your `edqvgznauwtprogcrvvb` project, which already
has the full schema, RLS policies, and storage buckets applied.

```bash
npm run dev
```

Visit `http://localhost:3000` (or your device IP from another device on the
same network) — Termux can't bind to a port other apps can reach unless you
either use `localhost` on-device or run `npm run dev -- -H 0.0.0.0`.

To make the first admin account: sign up normally in the app, then in the
Supabase SQL editor run:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

## What's real vs. what's next

**Working end-to-end right now:**
- Auth (signup/login/logout), profile auto-creation
- APK browse/search/details, real file sizes from actual uploaded bytes
- Upload flow: magic-byte + AndroidManifest.xml validation, SHA-256 hashing,
  duplicate-hash rejection, developer-scoped storage paths, per-user rate
  limiting, pending-review queue
- Download flow: signed URLs (5 min expiry), download logging, counters
- PWA submission (HTTPS-only, `.onion` blocked) and listing/details
- Favorites, download history, search history (with delete/clear)
- Notifications: DB trigger fires when a favorited app updates, throttled
  per-user; settings page to toggle on/off and set frequency
- Admin dashboard: approve/reject pending APKs & PWAs, resolve reports,
  post announcements, basic stats
- Offline: service worker caches the app shell, viewed APK/PWA details, and
  images — never bulk-caches APK binaries; falls back to `/offline`
- RLS on every table; storage bucket policies scoped by uploader

**Stubbed or not yet built** — real gaps, not hidden:
- Developer public profile pages (`/developer/[slug]`) and category browse
  pages (`/category/[slug]`) — referenced by links but not yet created
- No malware/virus scanning integration (the spec says never claim
  "virus-free" without one — none is wired in, so don't claim it)
- No image upload UI yet for icons/screenshots (schema + storage bucket
  ready; needs a form)
- No CSRF tokens on the server-action forms (Next.js server actions have
  built-in origin checking, but add an explicit token if you need
  defense-in-depth)
- App icons in `public/icons/` are plain placeholders — swap for real art
- No automated tests

## Project structure

```
app/            routes (App Router)
  api/          upload, download, pwa submission endpoints
  admin/        admin dashboard + server actions
  profile/      favorites, downloads, search history, settings, notifications
components/     shared UI
lib/            supabase clients, data fetchers, validation, formatting
public/         manifest.json, sw.js, icons
```

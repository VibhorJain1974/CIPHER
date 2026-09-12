# Challenge 01 — CIPHER Team Dashboard

A private, verified achievement board for team CIPHER. Members file what they did,
core clears it, and only then does it count. No spreadsheets, no shared drive.

**Live:** https://cipher-tsj-dashboard.vercel.app (sealed — enrolment is by minted code only)

## What it does

- **Filing.** A member picks a codex entry, sets the date it happened and the venue
  where it happened, attaches proof, names anyone who worked on it with them, and
  optionally links the folder in this repo. Nothing counts until core clears it.
- **Proof integrity.** Every attachment is SHA-256 hashed in the browser before upload,
  so the same screenshot cannot be filed twice under two names.
- **Three tiers of clearance.** Members file and read. Judges read and verify.
  Core does everything and mints codes. The two team leads are locked to core by a
  database trigger and cannot be demoted, by themselves or anyone else.
- **Row Level Security everywhere.** Members cannot read another member's queue or
  proof paths. Every view is `security_invoker`, so a view cannot be used as a way
  around the policies.
- **Audit trail.** Who looked at whose file, and every change to an entry or a profile,
  is written to an append-only log the way a git history reads.
- **Credit ledger.** The CREDITS screen answers "who actually built this" for any
  cleared deliverable, by member or by deliverable.
- **Per-member codes.** Enrolment codes are single-use and issued to one named person,
  so a code cannot be passed around or stolen.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres 17, Auth, Storage, RLS) · Vercel

## Running it

```bash
npm install
npm run dev
```

The Supabase project URL and anon key are in `src/lib/supabase/config.ts`. The anon key
is public by design; every table is protected by Row Level Security, so it grants only
what the policies allow.

## Layout

```
src/app/          screens — gate, login, enrol, dashboard
src/components/   agent card, radar, badge wall, filing bench, codex, nav
src/lib/          types, point rules, badge logic, glyph helpers
```

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
- **Three tiers of clearance.** Members file and read. Judges read and verify. Core
  does everything and mints codes. Leads and judges cannot file at all: the people who
  clear entries do not compete on the same ladder.
- **Row Level Security everywhere.** Every view is `security_invoker`, so a view cannot
  be used as a way around the policies. A member cannot read another member's queue,
  cannot change their own role, and cannot make themselves a locked lead.
- **Audit trail.** Who looked at whose file, and every change to an entry or a profile,
  is written to an append-only log the way a git history reads.
- **Credit ledger.** The CREDITS screen answers "who actually built this" for any
  cleared deliverable, by member or by deliverable.
- **Marks.** Twelve achievements, evaluated server-side by trigger. Striking one plays
  a full-screen ceremony on that member's screen, exactly once, ever.
- **Team feed and channel.** A live signal bar and a sealed team chat, both realtime.
- **Test nodes.** Core can spawn a disposable account, hidden from the crew and excluded
  from every total, and kill it with everything it produced.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres 17, Auth, Storage, RLS) · Vercel

## Running it

```bash
npm install
npm run dev
```

The Supabase URL and anon key are in `src/lib/supabase/config.ts`. The anon key is
public by design; Row Level Security is what protects the data. Never add a
service-role key to this repo.

## Mail

Supabase's built-in mailer is rate-limited to a handful of messages per hour and lands
in spam, so nothing the team relies on goes through it.

**Queue notifications** are an outbox, not a fire-and-forget send. A trigger writes a
row into `outbox` the moment an entry is filed, cleared or voided: leads are paged on
filing, the member is told when theirs clears or is voided, and the voided message
carries the reason the verifier actually typed. Test nodes are skipped so a demo never
pages anyone.

A `drain-outbox` Edge Function posts those through Resend once a minute on `pg_cron`,
marks the row sent only on a 2xx, and writes the provider's own error back onto the row
otherwise. Nothing is silently lost, and KEYS → OUTBOX shows anything still waiting with
COPY and MARK SENT for sending by hand.

The sender falls back: the team domain first, Resend's sandbox address second. An
unverified domain is a configuration state rather than a dead letter, so mail keeps
flowing to the account owner while DNS propagates and reaches everyone the moment it
verifies, with no redeploy.

Two settings finish the job:

1. **Authentication → Providers → Email → Confirm email OFF.** The board is sealed and
   entry is by minted single-use code, so a confirmation round trip adds nothing.
2. **Project Settings → Authentication → SMTP Settings** for password resets:

   ```
   Host      smtp.resend.com
   Port      465
   Username  resend
   Password  <Resend API key>
   ```

The Resend key belongs in **Edge Functions → Secrets** as `RESEND_API_KEY`, never in
this repo.

WhatsApp rows are written to the same outbox and deliberately left undelivered: there is
no free WhatsApp API, and both Twilio and Meta need a verified business sender. Marking
them sent would be a lie the panel then repeats back at you.

## Layout

```
src/app/          screens — gate, login, enrol, dashboard
src/components/   agent card, radar, medals, filing bench, codex, nav, chat
src/lib/          types, divisions, point rules, badge logic, avatars
```

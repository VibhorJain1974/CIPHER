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
in spam, so it is not used for anything the team relies on.

Two settings make enrolment work:

1. **Authentication → Providers → Email → Confirm email OFF.** The board is sealed and
   entry is by minted single-use code, so a confirmation round trip adds nothing.
2. **Project Settings → Authentication → SMTP Settings**, pointed at a real provider,
   for password resets. Resend's free tier (3,000/month) is enough several times over:

   ```
   Host      smtp.resend.com
   Port      465
   Username  resend
   Password  <Resend API key, starts re_>
   ```

Queue notifications (filed, cleared, voided) are written to the `outbox` table by
trigger and shown in KEYS → OUTBOX. Delivery is deliberately a separate step, so a
provider outage never blocks the board.

## Layout

```
src/app/          screens — gate, login, enrol, dashboard
src/components/   agent card, radar, medals, filing bench, codex, nav, chat
src/lib/          types, divisions, point rules, badge logic, avatars
```

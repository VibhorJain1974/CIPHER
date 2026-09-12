# CIPHER — Tech Sprint Journey 2026 Team Dashboard

Built with Next.js 16 + Supabase (Postgres, Auth, Storage) + Three.js.

## Deploy (takes ~2 minutes)

The Supabase backend is already live and wired into the code (URL + anon key are in `src/lib/supabase/config.ts` — the anon key is safe to expose, it's protected entirely by Row Level Security). You just need to deploy the frontend:

```bash
npm install -g vercel
cd cipher-dashboard
npm install
vercel --prod
```

Follow the prompts (log in with the Vercel account tied to vibhorjain1974's-projects). No environment variables need to be set — everything needed is already in the code.

## Or run locally first

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Invite codes (share with your team, change these later in Supabase if you want)

- Core members (Vibbhor, Harsh Gupta): `CIPHER-CORE-2026`
- External judges / AARVAK organisers (read-only): `CIPHER-JUDGE-2026`
- Everyone else: `CIPHER-CREW-2026`

## What's built

- Self-signup with invite code (auto-assigns core vs member role)
- Achievement submission with proof upload (image/PDF, SHA-256 hashed) — pending until a core member verifies it
- Core-only verification queue: approve + assign points, or reject with a reason
- Team leaderboard (cumulative, never averaged), points-by-category chart, 90-day activity heatmap
- Roster with view-only profiles — members can browse each other but can't edit anyone else
- Audit log (git-history style diff viewer) of every insert/update/delete on achievements — core only
- Profile access log — tracks who viewed whose profile and how many times — core only
- Duplicate-proof detection: flags when the same file (by hash) is reused across multiple submissions

## Supabase project

Project ref: `fxshhiklopnppyybbwxg` (in your `zyxwpokimatojwdtawkb` org, free tier, $0/month)
You have full access to it via the Supabase dashboard under your account.

## Honest limitations — read before demo day

- "No loophole" isn't a real security property for anything, including this. What's actually enforced: Postgres Row Level Security on every table (members can only ever touch their own achievement rows; only core members can verify, see all submissions, or read the audit/access logs), server-verified invite codes for role assignment (client can't self-promote to core), and file-type/size checks + SHA-256 hashing on proofs to catch obvious reuse.
- Proof verification is a duplicate-hash check and human review, not deepfake/tamper detection — a determined person could still fake a screenshot. Judges/organisers verifying visually is still the last line of defense, same as the rulebook says.
- Email confirmation is on by default (Supabase sends a confirmation link on signup). If that's annoying for a demo, it can be turned off in Supabase Auth settings.
- Storage/DB is on Supabase's free tier — fine for a team of 8-10, would need upgrading before it's the "Central AARVAK Dashboard" for all 5 teams.

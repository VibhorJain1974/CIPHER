# CIPHER dashboard — frontend handoff

**Owner: Tavishi Jain**
Live: https://cipher-tsj-dashboard.vercel.app
Repo: https://github.com/VibhorJain1974/CIPHER → `Challenge-01-Team-Dashboard/`

Read this end to end before changing anything. It is short on purpose.

---

## 1. Get it running

```bash
git clone https://github.com/VibhorJain1974/CIPHER.git
cd CIPHER/Challenge-01-Team-Dashboard
npm install
npm run dev          # http://localhost:3000
```

There is no `.env` file and you do not need one. The Supabase URL and the
anon key are committed in `src/lib/supabase/config.ts` on purpose: the anon
key is public by design and Row Level Security is what actually protects the
data. Do not add a service-role key to this repo, ever.

Sign in with the test account to poke at things:

```
testnode@cipher.local
CipherTest#2026
```

It is a `member`, so you see exactly what the crew sees. Ask Vibbhor for core
access if you need to look at QUEU, TRCE, KEYS or CRED.

---

## 2. How the app is laid out

```
src/app/
  page.tsx                  the gate (public)
  login/  signup/           auth screens, both use DecryptField as background
  auth/callback/route.ts    where the confirm link lands
  enrol/                    finishes a profile if one is somehow missing
  dashboard/
    layout.tsx              AUTH GUARD + nav + ceremony + chat. Everything under
                            /dashboard is behind this.
    page.tsx                NODE — filing bench + ledger + codex
    leaderboard/            RANK
    arcs/                   ARCS — cumulative line chart
    roster/                 CREW — the dossier cards
    profile/[id]/           FILE — the full dossier
    credits/                CRED — who built what (core + judge only)
    core/                   QUEU, TRCE (audit), KEYS (codes) — core only
    review/                 SEEN — verification queue (core + judge)

src/components/             see the component map below
src/lib/
  types.ts                  shared types, tiers, divisions, record ids, barcode
  badges.ts                 the twelve marks and the radar groups
  glyphs.ts                 block bars, ranking with ties, signal grid
  hash.ts                   SHA-256 of a proof file, done in the browser
  supabase/                 client / server / middleware factories
```

### Component map

| File | What it is |
| --- | --- |
| `Nav.tsx` | top bar, clock, D− counter, signal bell, theme toggle, sign out |
| `DecryptField.tsx` | the canvas 0/1 field on the auth screens, decrypts on hover |
| `LogArtefact.tsx` | the filing form: codex picker, venue, proof, contributors, repo link |
| `MyLedger.tsx` | a member's own entries and their status |
| `Codex.tsx` | the point rules, full width under the bench |
| `AgentSigil.tsx` | generated bust avatar, seeded from the account id |
| `AgentFigure.tsx` | generated standing figure, same seed |
| `AgentCard.tsx` | the pass, used on COMMAND cards |
| `CrewDossier.tsx` | the CREW card that expands on hover |
| `Radar.tsx` | six-axis SHAPE chart |
| `BadgeMedal.tsx` | one medal. Uses PNG art when it exists, draws it otherwise |
| `BadgeGlyph.tsx` | the line symbol inside a drawn medal |
| `BadgeWall.tsx` | the rack of twelve marks |
| `MarkCard.tsx` | the card a mark deals into when clicked |
| `Ceremony.tsx` | the full-screen unlock animation |
| `SignalBar.tsx` | the team feed in the nav |
| `Chat.tsx` | the team channel |
| `CodeMinter.tsx` | KEYS — mints per-member enrolment codes |

---

## 3. Rules that will bite you if you ignore them

**Styling is CSS custom properties, not Tailwind classes.** Everything comes
from the token block at the top of `src/app/globals.css`. Use
`var(--hot)`, `var(--bone)`, `var(--dim)` and so on. Never hardcode a hex in a
component, because light mode redefines every token and a hardcoded colour will
be invisible on paper. If you need a new colour, add it to **both** the
`:root` and the `:root[data-theme="light"]` blocks.

**Check light mode before you push.** Toggle it in the top right. This has
broken twice already, both times from a hardcoded dark hex.

**No `localStorage` for anything that matters.** It is fine for a remembered
tab or an unread count. Anything else goes to Supabase.

**No mock data. Ever.** If a panel has nothing to show, write an honest empty
state that tells the member what would fill it. There are examples all over
the codebase. A judge spotting a fake number costs us more than an empty panel.

**Respect `prefers-reduced-motion`.** Every animation in `globals.css` has a
reduced-motion block. Match that pattern.

**Type sizes are small and letter-spacing is wide.** That is the look. Labels
are 7 to 10px with `.14em` to `.3em` spacing, values are tabular. Use the
`.lbl`, `.lbl-faint`, `.lbl-hot` and `.val` classes rather than reinventing them.

---

## 4. Reading data

Client components use the browser client:

```ts
import { createClient } from "@/lib/supabase/client";
const { data } = await createClient().from("team_progress").select("*");
```

Server components use the server one (`@/lib/supabase/server`), which is
async and reads cookies.

**You never filter by permission in the frontend.** RLS already decides what
comes back. If a query returns nothing, the policy said no. Do not try to work
around it in the UI, tell Kartik.

Views worth knowing:

| View | Gives you |
| --- | --- |
| `team_progress` | one row per member: points, verified count, pending count |
| `team_totals` | the team's total and member count |
| `weekly_yield` | points per member per sprint week, drives every bar chart |
| `verified_log` | every cleared entry with points, repo link, contributors |
| `queue_view` | pending entries (core and judge only, by policy) |
| `credits_view` | one row per person per cleared piece of work |
| `signals` | the team feed |
| `chat` | the team channel |

---

## 5. Live updates

Signals, chat and mark awards are on Supabase realtime. The pattern:

```ts
const ch = sb.channel("name")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "signals" },
      (payload) => { /* payload.new */ })
  .subscribe();
return () => { sb.removeChannel(ch); };
```

Always remove the channel in the cleanup or you will leak subscriptions on
every navigation.

---

## 6. What is left to do

1. **The remaining six medals.** `public/badges/` has FRST, HEVY, POLY, RLNT,
   OPEN, APEX. Missing: STK7, STK30, SPTL, ARCV, CENT, KILL. When a PNG lands,
   drop it in that folder as `<CODE>.png` and add the code to the `ART` set at
   the top of `BadgeMedal.tsx`. That is the whole integration.
2. **Crew avatars.** Same idea. Prompts are in `Claude outputs/`. Once the art
   exists, `AgentSigil` and `AgentFigure` need an image path with the generated
   version as fallback.
3. **Mobile.** CREW and the dossier are desktop-first right now. The hover
   expand needs a tap equivalent under about 700px.
4. **A legend for the jargon.** Judges will not know what DECRYPTED, HELD or
   TIER-Ω mean. A small glossary panel on RANK would fix it.

---

## 7. Before you push

```bash
npm run build        # must pass, this is what Vercel runs
```

Then check, in this order: light mode, a screen at phone width, and that no
console errors appear on the dashboard. Push to a branch and tell Vibbhor.
Do not push straight to `main` while the sprint is live.

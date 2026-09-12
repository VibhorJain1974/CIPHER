# CIPHER dashboard — backend handoff

**Owner: Kartik Sharma**
Supabase project: `fxshhiklopnppyybbwxg` (ap-south-1, free tier)
Dashboard: https://supabase.com/dashboard/project/fxshhiklopnppyybbwxg
Repo: https://github.com/VibhorJain1974/CIPHER → `Challenge-01-Team-Dashboard/`

Ask Vibbhor to add you to the Supabase project. Read this before running any SQL.

---

## 1. The one rule that matters

**Every view must be created with `security_invoker = true`.**

A Postgres view runs with the rights of whoever *created* it unless you say
otherwise. Without that setting, any view over `achievements` hands every
member's submissions and proof paths to every other member, and Row Level
Security is silently bypassed. We caught this once on `queue_view` before it
shipped. If you add a view, write it like this:

```sql
create view public.thing with (security_invoker = true) as select ...;
```

To audit them all:

```sql
select c.relname, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v';
```

Every row must show `security_invoker=true`.

---

## 2. Roles

Three, in `member_role`:

| Role | Can |
| --- | --- |
| `member` | file entries, read the board, read other profiles |
| `judge` | everything a member can, plus verify entries and read CRED |
| `core` | everything, plus mint codes, read the audit trail, change roles |

`profiles.locked` is the important flag. Vibbhor and Harsh Gupta are `core`
with `locked = true`. The `enforce_core_lock()` trigger reverts any attempt to
change their role or unlock them, including their own. This exists because
Vibbhor once demoted himself by accident and locked himself out of KEYS.
**Do not remove that trigger.**

`core_preauth` holds emails that become core automatically on signup, so a
lead who has to re-register comes back as a lead.

---

## 3. Tables

| Table | What it holds |
| --- | --- |
| `profiles` | one row per account: name, department, role, locked. Created by trigger, never by the client |
| `achievements` | every filed entry: rule, title, venue, dates, proof, status, points, repo_url, contributors |
| `point_rules` | 27 rows. The scoring rulebook lives here as **data**, not in code |
| `invite_codes` | per-person single-use enrolment codes |
| `mark_awards` | which member struck which mark, and when they saw the ceremony |
| `signals` | the team feed |
| `chat` | the team channel |
| `audit_log` | every change to an entry or a profile |
| `access_log` | who looked at whose profile |
| `rival_teams` | the other four TSJ teams' scores |
| `core_preauth` | emails pre-authorised as core |

### Two timestamps, deliberately

`achievement_date` is when the thing happened, entered by the member.
`created_at` is when it was filed, from the server clock. They are different on
purpose: the queue ages by `created_at`, the charts plot by `achievement_date`,
and a member cannot backdate their way up the board.

`venue` is required only when the rule's `needs_venue` is true, enforced by a
trigger. DSA entries need no place, a meetup does.

---

## 4. Functions and triggers

| Name | Does |
| --- | --- |
| `handle_new_user()` | on `auth.users` insert. Validates the invite code and creates the profile. **This is why signup works** — at signup time there is no session, so a client-side insert is always rejected by RLS |
| `enforce_core_lock()` | reverts demotion or unlock of a locked lead |
| `apply_rule()` | stamps the points from `point_rules` when an entry is verified. Points are never taken from the client |
| `strike_marks()` | evaluates all twelve marks for every member, inserts new awards, posts to the feed. Idempotent: the primary key on `mark_awards` means a mark can only ever be struck once |
| `on_achievement_settled()` | trigger on `achievements`. Posts a feed signal on clear, then calls `strike_marks()` |
| `on_profile_created()` | posts an enrol signal |
| `mint_invite(name, role, hours)` | core only. Mints a single-use code. `hours` null means no expiry, which is the default |
| `redeem_invite(code)` | validates a code without consuming it |
| `is_core(uid)` / `can_review(uid)` | the permission helpers every policy uses |
| `log_achievement_change()` / `log_profile_change()` | write the audit trail |

Security-definer functions all carry `set search_path to 'public'`. Keep that
on anything new or you open a search-path attack.

---

## 5. Storage

Bucket `proofs`, private. Path is `<member_id>/<uuid>.<ext>`. Policies let a
member write only under their own id, and let core and judge read everything.

Proof files are SHA-256 hashed **in the browser** before upload and the hash is
stored on the row. Two members cannot file the same screenshot: the duplicate
hash is visible in the queue. The hash is a detection aid, not a wall — a
verifier still opens the file.

---

## 6. Known trap: enrolment

Email confirmation is on and, at the time of writing, the Supabase **Site URL
is still `http://localhost:3000`**. Confirm links therefore bounce to a dead
page. The click *does* confirm the account (verification happens before the
redirect), but members read the error page as failure and never come back to
sign in. Kartik, this one hit you.

The fix is a dashboard toggle, not SQL:

- Authentication → Providers → Email → **Confirm email OFF**
- Authentication → URL Configuration → Site URL → the Vercel URL

Until that is done the app copes: the enrol screen says the error page is
expected, login maps "not confirmed" to a plain message with a resend button,
and `/auth/callback` handles both the `?code=` and `?token_hash=` link shapes.

---

## 7. Working on the database

Use the Supabase SQL editor or the CLI. Two habits:

1. **Read before you write.** `select` the rows you are about to change.
2. **Never disable RLS to make something work.** If a query returns nothing,
   the policy is doing its job. Fix the policy, or fix the query.

Test a policy by signing in as the test account (`testnode@cipher.local`,
`CipherTest#2026`) rather than reasoning about it. That account is a plain
member and is safe to delete when we are done.

---

## 8. What is left to do

1. **The Site URL and the confirm-email toggle.** Highest priority, it is what
   blocks the last two members enrolling.
2. **Rival team scores.** `rival_teams` has four rows sitting at zero. They need
   entering as the organisers publish them, and a small core-only screen to
   edit them would beat running SQL by hand.
3. **A retention policy on `access_log`.** It grows on every profile view and
   nothing prunes it.
4. **Rejection reasons are free text.** A short enum of common reasons would
   make the audit trail far more readable at the showcase.
5. **`strike_marks()` loops over every member on every verify.** Fine at six
   members, wasteful at sixty. If this outlives the sprint, scope it to the
   member who changed plus the APEX recheck.

---

## 9. Do not

- Put a service-role key anywhere in the repo or in client code.
- Create a view without `security_invoker = true`.
- Drop `enforce_core_lock()`.
- Award points by hand. If a rule is wrong, fix the row in `point_rules`.
- Delete rows from `audit_log`. It is the git history of the board and it is
  the thing that proves the scores were not edited.

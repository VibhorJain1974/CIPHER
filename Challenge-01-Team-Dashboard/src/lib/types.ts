export type MemberRole = "member" | "core" | "judge";
export type SubmissionStatus = "pending" | "verified" | "rejected";
export type RuleScope = "team" | "individual" | "track";

export interface Profile {
  id: string;
  full_name: string;
  department: string;
  role: MemberRole;
  /** team leads: clearance is structural, cannot be demoted */
  locked: boolean;
  /** test or retired node: filtered from every board view unless you are core */
  hidden: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  phone: string | null;
  team: string;
  created_at: string;
}

export interface PointRule {
  code: string;
  category: string;
  label: string;
  short_label: string | null;
  points: number;
  scope: RuleScope;
  needs_venue: boolean;
  sort_order: number;
}

export interface Achievement {
  id: string;
  /** short human-facing ordinal, 0001 */
  seq: number;
  member_id: string;
  title: string;
  category: string;
  rule_code: string | null;
  description: string;
  venue: string | null;
  /** when the activity happened, entered by the member */
  achievement_date: string;
  /** when it was filed, server clock */
  created_at: string;
  proof_path: string | null;
  proof_filename: string | null;
  proof_hash: string | null;
  status: SubmissionStatus;
  points: number | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
}

export interface QueueRow extends Achievement {
  full_name: string;
  department: string;
  rule_label: string | null;
  rule_points: number | null;
  rule_scope: RuleScope | null;
}

export interface TeamProgressRow {
  member_id: string;
  full_name: string;
  department: string;
  verified_count: number;
  total_points: number;
  pending_count: number;
}

export interface RivalTeam {
  name: string;
  points: number;
  updated_at: string;
}

/** Codex bands. Nothing here is cosmetic: they gate how a total reads. */
export function tierOf(points: number): { code: string; col: string } {
  if (points >= 250) return { code: "TIER-Ω", col: "var(--hot)" };
  if (points >= 200) return { code: "TIER-I", col: "var(--hot)" };
  if (points >= 150) return { code: "TIER-II", col: "var(--bone)" };
  if (points >= 100) return { code: "TIER-III", col: "var(--dim)" };
  return { code: "TIER-IV", col: "var(--dimmer)" };
}

/** Weight decides visual size. A 250 and a 5 must never look alike. */
export function sizeFor(points: number | null | undefined): string {
  const v = Math.abs(points ?? 0);
  if (v >= 250) return "40px";
  if (v >= 100) return "32px";
  if (v >= 50) return "26px";
  if (v >= 20) return "20px";
  if (v >= 10) return "16px";
  return "13px";
}

/** One muted analogue hue per node. Deliberately no blue. */
export const NODE_COLOURS = [
  "#ff4a12", "#c07a4e", "#c4694a", "#9fa06a",
  "#b8846b", "#7f9086", "#a8705f", "#8c8378",
  "#9a938a", "#6f7d74", "#a98366", "#8a6f6a",
];
export function nodeColour(i: number) {
  return NODE_COLOURS[i % NODE_COLOURS.length];
}

/** The sprint window: 1 Sept to 15 Nov 2026. Weeks are the x-axis everywhere. */
export const SPRINT_START = new Date("2026-09-01T00:00:00Z");
export const SPRINT_END = new Date("2026-11-15T23:59:59Z");

export function weekIndex(dateISO: string): number {
  const d = new Date(dateISO + (dateISO.length <= 10 ? "T00:00:00Z" : ""));
  const ms = d.getTime() - SPRINT_START.getTime();
  return Math.max(0, Math.floor(ms / (7 * 864e5)));
}

export function sprintWeeks(): number {
  const ms = SPRINT_END.getTime() - SPRINT_START.getTime();
  return Math.ceil(ms / (7 * 864e5));
}

export function daysLeft(): number {
  return Math.max(0, Math.ceil((SPRINT_END.getTime() - Date.now()) / 864e5));
}

/* ── DIVISIONS ──────────────────────────────────────────────────────
   Departments get a field name. It is not decoration: the division is
   what shows on the dossier card and how the crew refers to each other.
   ------------------------------------------------------------------ */
export interface Division { code: string; name: string; glyph: string; col: string }

const DIVISIONS: { match: RegExp; div: Division }[] = [
  { match: /cyber|sec|ctf|hex/i,            div: { code: "HEX",  name: "HEX DIVISION",     glyph: "⬢", col: "#ff4a12" } },
  { match: /ai|ml|machine|data|neural/i,    div: { code: "NRL",  name: "NEURAL DIVISION",  glyph: "◈", col: "#c07a4e" } },
  { match: /web|front|back|full|dev|grid/i, div: { code: "GRD",  name: "GRID DIVISION",    glyph: "▦", col: "#9fa06a" } },
  { match: /dsa|algo|cp|vector/i,           div: { code: "VCT",  name: "VECTOR DIVISION",  glyph: "◤", col: "#b8846b" } },
  { match: /research|paper|quantum/i,       div: { code: "QNT",  name: "QUANTUM ARCHIVE",  glyph: "◉", col: "#7f9086" } },
  { match: /design|ui|ux|creative/i,        div: { code: "PRS",  name: "PRISM DIVISION",   glyph: "◭", col: "#a8705f" } },
  { match: /social|pr|media|comm|market/i,  div: { code: "SIG",  name: "SIGNAL DIVISION",  glyph: "◎", col: "#bfa46a" } },
  { match: /hr|ops|operation|event|manage/i,div: { code: "OPS",  name: "OPS COMMAND",      glyph: "✦", col: "#9a938a" } },
];

/** Every division, for the legend and the edit form. */
export const DIVISION_LIST: Division[] = DIVISIONS.map((d) => d.div);

export function divisionOf(department: string | null | undefined): Division {
  const d = department ?? "";
  for (const { match, div } of DIVISIONS) if (match.test(d)) return div;
  return { code: "UNC", name: "UNCLASSIFIED", glyph: "◇", col: "#8c8378" };
}

/** Clearance reads as a level on the card, the way a badge would show it. */
export function accessLevel(role: MemberRole, locked: boolean): number {
  if (role === "core") return locked ? 5 : 4;
  if (role === "judge") return 3;
  return 1;
}

/** Stable, human-sayable record id derived from the account id. */
export function recordId(uuid: string): string {
  const hex = uuid.replace(/-/g, "").toUpperCase();
  return `CPH.${hex.slice(0, 5)}-${hex.slice(5, 8)}-${hex.slice(8, 9)}`;
}

/** Deterministic barcode widths, so a card always looks like itself. */
export function barcode(uuid: string, bars = 44): number[] {
  const out: number[] = [];
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) >>> 0;
  for (let i = 0; i < bars; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out.push(1 + (h % 4));
  }
  return out;
}

import type { PointRule } from "./types";

/** Block-glyph bar. Mass you can read across a room, no percentages. */
export function mass(value: number, perBlock: number, cap = 16): string {
  const n = Math.max(value > 0 ? 1 : 0, Math.round(value / perBlock));
  return "▮".repeat(Math.min(n, cap));
}

/** Short ordinal a person can say out loud: 0042. */
export function seq(n: number | null | undefined): string {
  return String(n ?? 0).padStart(4, "0");
}

/**
 * Cheapest realistic combination of codex entries that closes a gap.
 * Greedy on weight, capped at four moves, because "one merged PR and one
 * paper" is actionable and "forty-two meetups" is not.
 */
export function pathTo(deficit: number, rules: PointRule[]): string {
  if (deficit <= 0) return "HELD";
  const pool = [...rules].sort((a, b) => b.points - a.points)
    .filter((r) => r.code !== "FNAL_WIN" && r.code !== "FNAL_RUNNER");

  let left = deficit;
  const picked: PointRule[] = [];
  for (const r of pool) {
    while (left > 0 && picked.length < 4 && r.points <= Math.max(left, r.points)) {
      if (r.points > left && picked.length > 0) break;
      picked.push(r);
      left -= r.points;
      if (left <= 0) break;
    }
    if (left <= 0 || picked.length >= 4) break;
  }
  if (!picked.length) return deficit + " PTS";

  const counts = new Map<string, number>();
  picked.forEach((r) => counts.set(r.code, (counts.get(r.code) ?? 0) + 1));

  const WORD = ["", "ONE", "TWO", "THREE", "FOUR"];
  const SHORT: Record<string, string> = {
    DSA_30: "30-DAY STREAK", DSA_7: "7-DAY STREAK", PAPR: "PAPER",
    HACK_1ST: "HACKATHON WIN", HACK_2ND: "2ND PLACE", HACK_3RD: "3RD PLACE",
    OSRC_SOC: "MERGED PR", OSRC_EXT: "EXTERNAL MERGE", OSRC_RAISED: "PR RAISED",
    PROJ_ADV: "ADVANCED PROJECT", PROJ_INTER: "PROJECT", CHLG_WIN: "CHALLENGE WIN",
    TRCK_STREAK: "TRACK STREAK", TRCK_WIN: "TRACK WIN", FNAL_PART: "FINAL ENTRY",
    TALK: "TECH TALK", BLOG: "ARTICLE", EXTN: "EXTERNAL EVENT", MEET_PRESENT: "MEETUP",
  };

  return [...counts.entries()]
    .map(([code, n]) => {
      const label = SHORT[code] ?? code;
      return n > 1 ? `${WORD[n] ?? n} ${label}S` : `ONE ${label}`;
    })
    .join(" + ");
}

/** 90-day activity grid, laid out in rows the way a punch card reads. */
export function signalGrid(byDate: Record<string, number>, days = 90, rows = 3) {
  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: byDate[key] ?? 0 });
  }
  const per = Math.ceil(days / rows);
  return Array.from({ length: rows }, (_, r) => cells.slice(r * per, (r + 1) * per));
}

/** Reads from the theme so the grid never renders black blocks on paper. */
export const SIGNAL_STEPS = [
  "var(--grid-0)", "var(--grid-1)", "var(--grid-2)", "var(--grid-3)",
];

export function signalLevel(count: number, peak: number): number {
  if (count <= 0) return 0;
  const ratio = count / Math.max(peak, 1);
  if (ratio > 0.66) return 3;
  if (ratio > 0.33) return 2;
  return 1;
}

/**
 * Competition ranking. Equal points share a place and the next one skips:
 * 1, 2, 2, 4. With everyone on zero on day one, everyone is genuinely
 * first, and pretending otherwise invents a hierarchy that does not exist.
 */
export function ranks(points: number[]): number[] {
  const out: number[] = [];
  let place = 0;
  points.forEach((p, i) => {
    if (i === 0 || p !== points[i - 1]) place = i + 1;
    out.push(place);
  });
  return out;
}

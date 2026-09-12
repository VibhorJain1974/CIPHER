import { weekIndex } from "./types";

export interface BadgeInput {
  entries: { points: number; category: string; rule_code: string | null; achievement_date: string }[];
  total: number;
  voided: number;
  isTop: boolean;
}

export interface Badge {
  code: string;
  name: string;
  blurb: string;
  earned: boolean;
  /** how close, 0..1, for the locked ones */
  progress: number;
  note: string;
}

/**
 * Badges are computed, never awarded by hand. Every one of them answers a
 * question a judge would actually ask, so a locked badge still tells the
 * member exactly what closes it.
 */
export function badgesFor({ entries, total, voided, isTop }: BadgeInput): Badge[] {
  const n = entries.length;
  const best = entries.reduce((m, e) => Math.max(m, e.points), 0);
  const cats = new Set(entries.map((e) => e.category)).size;
  const weeks = new Set(entries.map((e) => weekIndex(e.achievement_date))).size;
  const has = (re: RegExp) => entries.some((e) => re.test(e.rule_code ?? ""));

  const b = (
    code: string, name: string, blurb: string,
    earned: boolean, progress: number, note: string,
  ): Badge => ({ code, name, blurb, earned, progress: Math.min(1, progress), note });

  return [
    b("FRST", "FIRST BLOOD", "First entry cleared review.",
      n >= 1, n, n >= 1 ? "CLEARED" : "FILE ONE ENTRY"),

    b("KILL", "KILLING BLOW", "A single entry worth 100 or more.",
      best >= 100, best / 100, best >= 100 ? `${best} IN ONE` : "NEEDS A 100+ ENTRY"),

    b("HEVY", "HEAVY HITTER", "A single entry worth 50 or more.",
      best >= 50, best / 50, best >= 50 ? `BEST ${best}` : "NEEDS A 50+ ENTRY"),

    b("STK7", "SEVEN STRAIGHT", "A 7-day DSA streak on the board.",
      has(/^DSA_7$/), has(/^DSA_7$/) ? 1 : 0, has(/^DSA_7$/) ? "LOGGED" : "LOG A 7-DAY STREAK"),

    b("STK30", "THIRTY STRAIGHT", "A 30-day DSA streak on the board.",
      has(/^DSA_30$/), has(/^DSA_30$/) ? 1 : 0, has(/^DSA_30$/) ? "LOGGED" : "LOG A 30-DAY STREAK"),

    b("POLY", "POLYMATH", "Cleared work in three different categories.",
      cats >= 3, cats / 3, cats >= 3 ? `${cats} CATEGORIES` : `${cats} OF 3`),

    b("RLNT", "RELENTLESS", "Cleared work in four separate sprint weeks.",
      weeks >= 4, weeks / 4, weeks >= 4 ? `${weeks} WEEKS` : `${weeks} OF 4`),

    b("SPTL", "SPOTLESS", "Five cleared entries, nothing voided.",
      n >= 5 && voided === 0, n / 5,
      voided > 0 ? `${voided} VOIDED` : n >= 5 ? "CLEAN" : `${n} OF 5`),

    b("ARCV", "ARCHIVIST", "A research paper on the board.",
      has(/^PAPR$/), has(/^PAPR$/) ? 1 : 0, has(/^PAPR$/) ? "FILED" : "FILE A PAPER"),

    b("OPEN", "OPEN HAND", "An open-source contribution merged.",
      has(/^OSRC_/), has(/^OSRC_/) ? 1 : 0, has(/^OSRC_/) ? "MERGED" : "MERGE A PR"),

    b("CENT", "CENTURION", "One hundred points banked.",
      total >= 100, total / 100, total >= 100 ? `${total} BANKED` : `${total} OF 100`),

    b("APEX", "APEX", "Top of the CIPHER board.",
      isTop && total > 0, isTop && total > 0 ? 1 : 0,
      isTop && total > 0 ? "HOLDING" : "TAKE THE LEAD"),
  ];
}

/**
 * Five axes for the dossier radar. Each is a ratio against a target a
 * member can actually reach inside the 75-day window, so the shape means
 * something instead of being scaled to whoever happens to be ahead.
 */
export function radarAxes({ entries, total }: Pick<BadgeInput, "entries" | "total">) {
  const n = entries.length;
  const best = entries.reduce((m, e) => Math.max(m, e.points), 0);
  const cats = new Set(entries.map((e) => e.category)).size;
  const weeks = new Set(entries.map((e) => weekIndex(e.achievement_date))).size;
  const avg = n ? total / n : 0;

  return [
    { key: "VOLUME",  label: "VOLUME",      v: Math.min(1, n / 12),    raw: `${n}` },
    { key: "WEIGHT",  label: "PEAK WEIGHT", v: Math.min(1, best / 100), raw: `${best}` },
    { key: "SPREAD",  label: "SPREAD",      v: Math.min(1, cats / 5),   raw: `${cats}` },
    { key: "TEMPO",   label: "TEMPO",       v: Math.min(1, weeks / 8),  raw: `${weeks}W` },
    { key: "DENSITY", label: "DENSITY",     v: Math.min(1, avg / 40),   raw: `${Math.round(avg)}` },
  ];
}

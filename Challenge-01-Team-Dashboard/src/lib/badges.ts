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
  /** the condition, written as an instruction */
  blurb: string;
  earned: boolean;
  /** how close, 0..1, for the locked ones */
  progress: number;
  /** where the member stands against it right now */
  note: string;
  /** what is still missing, in plain words */
  need: string;
  /** rarity, 1 easiest to 5 hardest. Drives the card's cost badge. */
  weight: number;
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
    code: string, name: string, weight: number, blurb: string,
    earned: boolean, progress: number, note: string, need: string,
  ): Badge => ({ code, name, weight, blurb, earned, progress: Math.min(1, progress), note, need });

  const dsa7 = has(/^DSA_7$/), dsa30 = has(/^DSA_30$/);
  const papr = has(/^PAPR$/), osrc = has(/^OSRC_/);

  return [
    b("FRST", "FIRST BLOOD", 1, "Get one entry through review.",
      n >= 1, n, n >= 1 ? "STRUCK" : "0 CLEARED",
      n >= 1 ? "Nothing left. This one is yours." : "File a single entry and have a lead clear it."),

    b("KILL", "KILLING BLOW", 5, "Land one entry worth 100 or more.",
      best >= 100, best / 100, best >= 100 ? `BEST ${best}` : `BEST ${best}`,
      best >= 100 ? "Struck." : `${100 - best} more weight in a single entry. A 30-day DSA streak or a final-project runner-up does it alone.`),

    b("HEVY", "HEAVY HITTER", 3, "Land one entry worth 50 or more.",
      best >= 50, best / 50, `BEST ${best}`,
      best >= 50 ? "Struck." : `${50 - best} more weight in a single entry. A hackathon win, a paper, or a final-project entry does it.`),

    b("STK7", "SEVEN STRAIGHT", 2, "Put a 7-day DSA streak on the board.",
      dsa7, dsa7 ? 1 : 0, dsa7 ? "LOGGED" : "NOT LOGGED",
      dsa7 ? "Struck." : "Solve daily for seven days, then file it under 7-DAY DSA STREAK with proof."),

    b("STK30", "THIRTY STRAIGHT", 5, "Put a 30-day DSA streak on the board.",
      dsa30, dsa30 ? 1 : dsa7 ? 0.23 : 0, dsa30 ? "LOGGED" : dsa7 ? "SEVEN DONE" : "NOT LOGGED",
      dsa30 ? "Struck." : "Thirty unbroken days. Worth 100 on its own, the heaviest thing one person can bank alone."),

    b("POLY", "POLYMATH", 3, "Clear work in three different categories.",
      cats >= 3, cats / 3, `${cats} OF 3`,
      cats >= 3 ? "Struck." : `${3 - cats} more ${3 - cats === 1 ? "category" : "categories"}. Mix a build, a competition and something written.`),

    b("RLNT", "RELENTLESS", 3, "Clear work in four separate sprint weeks.",
      weeks >= 4, weeks / 4, `${weeks} OF 4`,
      weeks >= 4 ? "Struck." : `${4 - weeks} more ${4 - weeks === 1 ? "week" : "weeks"}. Spread it out. Four entries in one week counts once.`),

    b("SPTL", "SPOTLESS", 4, "Five cleared entries and nothing voided.",
      n >= 5 && voided === 0, voided > 0 ? 0 : n / 5,
      voided > 0 ? `${voided} VOIDED` : `${n} OF 5`,
      voided > 0 ? "Out of reach this sprint. A voided entry cannot be taken back."
        : n >= 5 ? "Struck." : `${5 - n} more clean ${5 - n === 1 ? "entry" : "entries"}. One rejection closes this for good, so file honestly.`),

    b("ARCV", "ARCHIVIST", 4, "Put a research paper on the board.",
      papr, papr ? 1 : 0, papr ? "FILED" : "NOT FILED",
      papr ? "Struck." : "One research paper, filed with proof. Worth 50."),

    b("OPEN", "OPEN HAND", 3, "Get an open-source contribution merged.",
      osrc, osrc ? 1 : 0, osrc ? "MERGED" : "NOT MERGED",
      osrc ? "Struck." : "Raise a PR and get it merged. Society repo is worth 25, external 20."),

    b("CENT", "CENTURION", 4, "Bank one hundred points.",
      total >= 100, total / 100, `${total} OF 100`,
      total >= 100 ? "Struck." : `${100 - total} to go.`),

    b("APEX", "APEX", 5, "Hold the top of the CIPHER board.",
      isTop && total > 0, isTop && total > 0 ? 1 : 0,
      isTop && total > 0 ? "HOLDING" : "NOT HOLDING",
      isTop && total > 0 ? "Held. It is only yours while it is yours." : "Outscore everyone else on the team. Ties do not count."),
  ];
}

/**
 * The radar axes are the codex itself, folded into six readable groups. A
 * member's shape is therefore a statement about what kind of work they do,
 * not a score dressed up as a pentagon. Targets are what one person can
 * realistically reach inside the 75-day window, so the shape means the same
 * thing for everyone instead of being scaled to whoever happens to lead.
 */
export const RADAR_GROUPS: { label: string; cats: string[]; target: number }[] = [
  { label: "BUILD",    cats: ["PROJ", "FNAL"],           target: 80 },
  { label: "COMPETE",  cats: ["HACK", "CHLG"],           target: 80 },
  { label: "ALGO",     cats: ["DSA"],                    target: 100 },
  { label: "OPEN SRC", cats: ["OSRC"],                   target: 50 },
  { label: "RESEARCH", cats: ["PAPR", "TALK", "BLOG"],   target: 60 },
  { label: "PRESENCE", cats: ["MEET", "EXTN", "TRCK"],   target: 45 },
];

export function radarAxes({ entries }: Pick<BadgeInput, "entries">) {
  return RADAR_GROUPS.map((g) => {
    const pts = entries
      .filter((e) => g.cats.includes(e.category))
      .reduce((s, e) => s + e.points, 0);
    return { label: g.label, v: Math.min(1, pts / g.target), raw: String(pts) };
  });
}

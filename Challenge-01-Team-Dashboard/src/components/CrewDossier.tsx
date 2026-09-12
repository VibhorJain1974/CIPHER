"use client";

import Link from "next/link";
import {
  accessLevel, barcode, divisionOf, recordId, tierOf,
  type MemberRole,
} from "@/lib/types";
import { RADAR_GROUPS, type Badge } from "@/lib/badges";
import AgentSigil from "./AgentSigil";
import BadgeMedal from "./BadgeMedal";

export interface CrewEntry {
  title: string; category: string; achievement_date: string; points: number;
}

/**
 * A crew card that opens into the member's dossier on hover. Everything on
 * it is read from the board: no invented stats, no filler bars. Where a
 * member has banked nothing the panels say so rather than showing zeros
 * dressed up as data.
 *
 * The card grows out of its grid cell instead of pushing the grid around,
 * so nothing reflows under the cursor.
 */
export default function CrewDossier({
  id, name, department, role, locked, points, rank, verified, held, marks, badges, entries, series, isTop,
}: {
  id: string; name: string; department: string; role: MemberRole; locked: boolean;
  points: number; rank: number; verified: number; held: number;
  marks: number; badges: Badge[]; entries: CrewEntry[]; series: number[];
  /** currently holds the highest banked points on the field — gets a glow, not just a number */
  isTop?: boolean;
}) {
  const div = divisionOf(department);
  const lvl = accessLevel(role, locked);
  const tier = tierOf(points);
  const rec = recordId(id);
  const live = points > 0 || role === "core";
  const struck = badges.filter((b) => b.earned);

  // the specialisation bars are the codex groups, at real weight
  const spec = RADAR_GROUPS.map((g) => {
    const pts = entries.filter((e) => g.cats.includes(e.category)).reduce((s, e) => s + e.points, 0);
    return { label: g.label, pts, pct: Math.min(100, Math.round((pts / g.target) * 100)) };
  });

  return (
    <div className="dcard-slot">
      <Link href={`/dashboard/profile/${id}`} className={`dcard${isTop ? " aura-glow" : ""}`}
        style={{ borderLeftColor: div.col, ...(isTop ? { ["--aura-col" as string]: "var(--hot)" } : {}) }}>
        <span className="dcard-glitch" />

        {/* ambient layers, only once open */}
        <span className="dcard-bg">
          <span className="dcard-dots" />
          <span className="dcard-rain">{RAIN}</span>
        </span>

        {(["tl", "tr", "bl", "br"] as const).map((k) => (
          <span key={k} className={`dcard-brk ${k}`} style={{ borderColor: div.col }} />
        ))}

        {/* chrome */}
        <span className="dcard-chrome">
          <span className="dcard-logo" style={{ color: div.col }}>
            <span className="dcard-mark" style={{ borderColor: div.col }} />CIPHER
          </span>
          <span className="dcard-clr">
            CLEARANCE <b style={{ color: div.col }}>{role === "core" ? "CORE" : role === "judge" ? "JUDGE" : "FIELD"}</b>
          </span>
        </span>

        {/* portrait plate */}
        <span className="dcard-plate" style={{ background: `radial-gradient(85% 70% at 50% 34%, ${div.col}18, var(--void) 74%)` }}>
          <span className="dcard-scan" />
          <span className="dcard-sigil"><AgentSigil id={id} name={name} col={div.col} size={150} live={live} /></span>
          <span className="dcard-scrim" />
          <span className="dcard-plate-edge" style={{ borderColor: `${div.col}66` }} />

          <span className="dcard-idblock">
            <span className="dcard-node" style={{ color: div.col }}>{rec}</span>
            <span className="dcard-name">{name.toUpperCase()}</span>
            <span className="dcard-tags">
              <span className="dcard-tag" style={{ color: div.col, borderColor: `${div.col}66` }}>{div.name}</span>
              <span className="dcard-tag">{(department || "UNASSIGNED").toUpperCase()}</span>
              <span className="dcard-tag">{tier.code}</span>
            </span>
          </span>

          <span className="dcard-pulse">
            <svg viewBox="0 0 300 20" preserveAspectRatio="none">
              <path d="M0,10 L58,10 L68,3 L78,17 L88,10 L148,10 L158,4 L168,16 L178,10 L300,10"
                fill="none" stroke={div.col} strokeWidth="1" />
            </svg>
          </span>
        </span>

        {/* resting strip */}
        <span className="dcard-strip">
          <span className="dcard-cell">
            <span className="dcard-cl">STANDING</span>
            <span className="dcard-cv" style={{ color: rank === 1 && points > 0 ? "var(--hot)" : "var(--bone)" }}>
              {String(rank).padStart(2, "0")}
            </span>
          </span>
          <span className="dcard-cell">
            <span className="dcard-cl">POINTS</span>
            <span className="dcard-cv" style={{ color: points ? "var(--hot)" : "var(--dimmer)" }}>{points}</span>
          </span>
          <span className="dcard-cell">
            <span className="dcard-cl">MARKS</span>
            <span className="dcard-cv">{marks}/12</span>
          </span>
        </span>

        <span className="dcard-hint">HOVER TO DECRYPT DOSSIER<span className="caret">_</span></span>

        {/* ── the dossier ─────────────────────────────────────────── */}
        <span className="dcard-body">

          <Sec title="AGENT DOSSIER" i={1}>
            <span className="dcard-grid">
              <F k="RECORD" v={rec} />
              <F k="UNIT" v={`CIPHER / ${div.code}`} />
              <F k="CLEARANCE" v={`${lvl} · ${role === "core" ? "COMMAND" : role === "judge" ? "OBSERVER" : "FIELD"}`} />
              <F k="DEPARTMENT" v={(department || "UNASSIGNED").toUpperCase()} />
              <F k="TIER" v={tier.code} />
              <F k="STANDING" v={String(rank).padStart(2, "0")} hot />
            </span>
          </Sec>

          <Sec title="BOARD" i={2}>
            <span className="dcard-stats">
              <St n={points} l="POINTS BANKED" hot />
              <St n={verified} l="DECRYPTED" />
              <St n={held} l="IN QUEUE" />
              <St n={marks} l="MARKS STRUCK" />
              <St n={new Set(entries.map((e) => e.category)).size} l="CATEGORIES" />
              <St n={series.filter((v) => v > 0).length} l="ACTIVE WEEKS" />
            </span>
          </Sec>

          <Sec title="WHERE THE WEIGHT SITS" i={3}>
            {points === 0 ? (
              <span className="dcard-empty">NOTHING BANKED YET. THE BARS FILL AS ENTRIES CLEAR REVIEW.</span>
            ) : spec.map((s) => (
              <span key={s.label} className="dcard-bar">
                <span className="dcard-barhead">
                  <span>{s.label}</span><b style={{ color: div.col }}>{s.pts}</b>
                </span>
                <span className="dcard-bartrack">
                  <span className="dcard-barfill" style={{ width: `${s.pct}%`, background: div.col }} />
                </span>
              </span>
            ))}
          </Sec>

          <Sec title="LATEST DECRYPTIONS" i={4}>
            {entries.length === 0 ? (
              <span className="dcard-empty">NOTHING CLEARED YET.</span>
            ) : (
              <span className="dcard-tl">
                {entries.slice(0, 5).map((e, i) => (
                  <span key={i} className="dcard-tle" style={{ ["--dot" as string]: div.col }}>
                    <span className="dcard-tld">{e.achievement_date} · {e.category}</span>
                    <span className="dcard-tll">{e.title.toUpperCase()} <b style={{ color: div.col }}>+{e.points}</b></span>
                  </span>
                ))}
              </span>
            )}
          </Sec>

          <Sec title="MARKS STRUCK" i={5}>
            {struck.length === 0 ? (
              <span className="dcard-empty">NO MARKS YET. TWELVE ARE IN PLAY.</span>
            ) : (
              <span className="dcard-medals">
                {struck.map((b) => (
                  <span key={b.code} className="dcard-medal" title={b.name}>
                    <BadgeMedal code={b.code} weight={b.weight} earned size={40} />
                    <span className="dcard-medal-l">{b.code}</span>
                  </span>
                ))}
              </span>
            )}
          </Sec>

          <Sec title="IDENTITY VERIFICATION" i={6}>
            <span className="dcard-verify">
              <span className="dcard-fp">
                <svg viewBox="0 0 100 100">
                  {[10, 18, 26, 34, 42].map((o, i) => (
                    <path key={i} fill="none" stroke={div.col} strokeWidth="0.8" opacity="0.75"
                      d={`M50 ${o} C${25 + i * 4} ${o} ${10 + i * 6} ${30 + i * 2} ${10 + i * 6} 50 C${10 + i * 6} ${75 - i * 3} ${25 + i * 4} ${92 - i * 5} 50 ${92 - i * 6}`} />
                  ))}
                </svg>
              </span>
              <span className="dcard-vtext">
                RECORD<br /><b>{rec}</b><br />
                CONFIRMED BY<br /><b>CIPHER CORE</b>
              </span>
            </span>
            <span className="dcard-bars">
              {barcode(id, 46).map((w, i) => (
                <span key={i} style={{
                  width: w, height: "100%",
                  background: i % 5 === 0 ? div.col : "var(--dimmer)",
                  opacity: i % 3 === 0 ? 0.9 : 0.4,
                }} />
              ))}
            </span>
            <span className="dcard-stamp" style={{ color: `${div.col}`, borderColor: `${div.col}44` }}>
              SEALED // NO PUBLIC ROUTE // CIPHER
            </span>
          </Sec>

        </span>
      </Link>
    </div>
  );
}

const RAIN = Array.from({ length: 46 }, () =>
  Array.from({ length: 62 }, (_, i) => (i * 7919 % 13 > 6 ? "1" : "0")).join("")
).join("\n");

function Sec({ title, i, children }: { title: string; i: number; children: React.ReactNode }) {
  return (
    <span className="dcard-sec" style={{ animationDelay: `${0.12 + i * 0.07}s` }}>
      <span className="dcard-sect">{title}</span>
      {children}
    </span>
  );
}

function F({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <span className="dcard-f">
      <span className="dcard-fk">{k}</span>
      <span className="dcard-fv" style={hot ? { color: "var(--hot)" } : undefined}>{v}</span>
    </span>
  );
}

function St({ n, l, hot }: { n: number; l: string; hot?: boolean }) {
  return (
    <span className="dcard-st">
      <span className="dcard-stn" style={{ color: hot && n ? "var(--hot)" : n ? "var(--bone)" : "var(--dimmer)" }}>{n}</span>
      <span className="dcard-stl">{l}</span>
    </span>
  );
}

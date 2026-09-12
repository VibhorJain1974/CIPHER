"use client";

import type { Badge } from "@/lib/badges";

/** Twelve slots, always all twelve. A locked card states its own condition,
 *  so the wall doubles as the list of what is worth chasing. */
export default function BadgeWall({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div className="panel">
      <div style={{ padding: "11px 15px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
        <span className="lbl">MARKS</span>
        <span className="lbl-faint">{earned} OF {badges.length} STRUCK</span>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))",
        gap: 1, background: "var(--line-2)",
      }}>
        {badges.map((b) => (
          <div key={b.code} title={b.blurb} style={{
            background: b.earned ? "var(--void-hot)" : "var(--panel-2)",
            padding: "13px 14px", position: "relative", minHeight: 92,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            opacity: b.earned ? 1 : 0.62,
          }}>
            {b.earned && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "var(--hot)" }} />}
            <div>
              <div className="lbl val" style={{ fontSize: 8, color: b.earned ? "var(--hot)" : "var(--faint)" }}>{b.code}</div>
              <div style={{
                fontSize: 11, letterSpacing: ".08em", marginTop: 6, lineHeight: 1.35,
                color: b.earned ? "var(--bone)" : "var(--dimmer)",
              }}>{b.name}</div>
            </div>
            <div>
              {!b.earned && (
                <div style={{ height: 2, background: "var(--line)", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${Math.round(b.progress * 100)}%`, background: "var(--ember)" }} />
                </div>
              )}
              <div className="lbl-faint" style={{ fontSize: 7.5, color: b.earned ? "var(--ember)" : "var(--faint)" }}>
                {b.note}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

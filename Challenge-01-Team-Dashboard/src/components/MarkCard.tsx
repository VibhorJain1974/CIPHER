"use client";

import { useEffect } from "react";
import type { Badge } from "@/lib/badges";
import BadgeMedal from "./BadgeMedal";

/**
 * A mark, dealt as a card. The art is generated from the mark's own glyph,
 * the cost badge is its rarity, and the rules box below tells the member
 * exactly what closes it and how far off they are. Nothing here is fluff:
 * a locked card is the clearest instruction on the whole dashboard.
 */
export default function MarkCard({ badge, col, onClose }: { badge: Badge; col: string; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const on = badge.earned;
  const edge = on ? col : "var(--dimmer)";
  const pct = Math.round(badge.progress * 100);

  return (
    <div onClick={onClose} className="mark-veil">
      <div onClick={(e) => e.stopPropagation()} className="mark-card" style={{ borderColor: edge }}>
        {/* notched corners, the way a game card is cut */}
        {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
          <span key={v + h} style={{
            position: "absolute", [v]: -1, [h]: -1, width: 18, height: 18,
            [`border${v[0].toUpperCase() + v.slice(1)}`]: `3px solid ${edge}`,
            [`border${h[0].toUpperCase() + h.slice(1)}`]: `3px solid ${edge}`,
          } as React.CSSProperties} />
        ))}

        {/* cost badge */}
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 3, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            display: "grid", placeItems: "center", width: 30, height: 30,
            clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
            background: on ? col : "var(--line)", color: "var(--void)",
            fontSize: 12, fontWeight: 700,
          }}>{badge.weight}</span>
          <span className="lbl val" style={{ fontSize: 9, color: edge }}>{badge.code}</span>
        </div>

        <button onClick={onClose} aria-label="close" style={{
          position: "absolute", top: 12, right: 12, zIndex: 3, border: "none", background: "transparent",
          color: "var(--dim)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 4,
        }}>×</button>

        {/* art plate */}
        <div style={{
          height: 224, position: "relative", overflow: "hidden",
          background: on
            ? `radial-gradient(120% 90% at 50% 20%, ${col}33, var(--void) 72%)`
            : "radial-gradient(120% 90% at 50% 20%, var(--line-2), var(--void) 72%)",
          borderBottom: `1px solid ${edge}`,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 4px)",
          }} />
          <div className={on ? "mark-art mark-art-live" : "mark-art"}
            style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <BadgeMedal code={badge.code} weight={badge.weight} earned={on} progress={badge.progress} size={168} />
          </div>
          {!on && (
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
              <span className="lbl" style={{ fontSize: 9, color: "var(--faint)", letterSpacing: ".3em" }}>SEALED</span>
            </div>
          )}
        </div>

        {/* title bar */}
        <div style={{ padding: "13px 18px", background: on ? "var(--void-hot)" : "var(--panel-2)", borderBottom: `1px solid ${edge}` }}>
          <div style={{ fontSize: 19, letterSpacing: ".07em", color: on ? "var(--bone)" : "var(--dim)" }}>
            {badge.name}
          </div>
        </div>

        {/* rules box */}
        <div style={{ padding: "16px 18px 18px", background: "var(--void)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{ color: col, flexShrink: 0 }}>↳</span>
            <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--bone)" }}>{badge.blurb}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: on ? col : "var(--ember)", flexShrink: 0 }}>↳</span>
            <span style={{ fontSize: 11.5, lineHeight: 1.75, color: "var(--dim)" }}>{badge.need}</span>
          </div>

          {!on && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="lbl-faint" style={{ fontSize: 8 }}>PROGRESS</span>
                <span className="lbl val" style={{ fontSize: 9, color: "var(--ember)" }}>{badge.note} · {pct}%</span>
              </div>
              <div style={{ height: 3, background: "var(--line)" }}>
                <div style={{ height: "100%", width: `${Math.max(pct, 1)}%`, background: "var(--ember)" }} />
              </div>
            </div>
          )}

          {on && (
            <div style={{ marginTop: 16, border: `1px solid ${col}`, padding: "8px 11px", display: "inline-block" }}>
              <span className="lbl val" style={{ fontSize: 9, color: col }}>STRUCK · {badge.note}</span>
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: "center", color: "var(--faint)", fontSize: 8, letterSpacing: ".45em" }}>
            {badge.code.split("").map((c) => c.charCodeAt(0) % 2 ? "1" : "0").join(" ")}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Badge } from "@/lib/badges";
import BadgeMedal from "./BadgeMedal";
import MarkCard from "./MarkCard";

/**
 * Twelve slots, always all twelve, shown as a rack of small marks. Clicking
 * one deals its card, which carries the condition and the distance left.
 * The rack stays quiet so the dossier is not twelve paragraphs of text.
 */
export default function BadgeWall({ badges, col = "var(--hot)", canReplay }: { badges: Badge[]; col?: string; canReplay?: boolean }) {
  const [open, setOpen] = useState<Badge | null>(null);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="panel">
      <div style={{ padding: "11px 15px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl">MARKS</span>
        <span className="lbl-faint">{earned} OF {badges.length} STRUCK · TAP ONE TO READ IT</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 15 }}>
        {badges.map((b) => (
          <button key={b.code} onClick={() => setOpen(b)} title={b.name}
            className="mark-chip"
            style={{
              borderColor: b.earned ? col : "var(--line)",
              background: b.earned ? "var(--void-hot)" : "transparent",
              opacity: b.earned ? 1 : 0.72,
            }}>
            <BadgeMedal code={b.code} weight={b.weight} earned={b.earned} progress={b.progress} size={54} />
            <span className="lbl val" style={{ fontSize: 7.5, color: b.earned ? col : "var(--faint)" }}>{b.code}</span>
          </button>
        ))}
      </div>

      {open && <MarkCard badge={open} col={col} canReplay={canReplay} onClose={() => setOpen(null)} />}
    </div>
  );
}

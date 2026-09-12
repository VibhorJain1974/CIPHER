"use client";

import { useEffect, useState } from "react";
import type { Badge } from "@/lib/badges";
import BadgeMedal from "./BadgeMedal";

const CELLS = 150;

/**
 * The strike itself. A mark assembles out of ones and zeroes converging from
 * every edge, holds, then clears. Kept separate from the award plumbing so
 * the same sequence can be replayed on demand without touching the record of
 * who has actually earned what.
 */
export default function CeremonyStage({
  badge, onDone, preview,
}: { badge: Badge; onDone: () => void; preview?: boolean }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    setPhase("in");
    const t1 = setTimeout(() => setPhase("hold"), 1500);
    const t2 = setTimeout(() => setPhase("out"), 4600);
    const t3 = setTimeout(onDone, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [badge.code, onDone]);

  return (
    <div className={`cer cer-${phase}`} aria-live="polite">
      <div className="cer-field" aria-hidden>
        {Array.from({ length: CELLS }, (_, i) => {
          const edge = i % 4;
          const p = ((i * 37) % 100) / 100;
          const from =
            edge === 0 ? { x: `${p * 100 - 50}vw`, y: "-60vh" } :
            edge === 1 ? { x: "60vw", y: `${p * 100 - 50}vh` } :
            edge === 2 ? { x: `${p * 100 - 50}vw`, y: "60vh" } :
                         { x: "-60vw", y: `${p * 100 - 50}vh` };
          const hue = [0, 22, 42, 190][i % 4];
          return (
            <span key={i} className="cer-bit" style={{
              ["--fx" as string]: from.x,
              ["--fy" as string]: from.y,
              ["--tx" as string]: `${((i * 53) % 40) - 20}px`,
              ["--ty" as string]: `${((i * 29) % 40) - 20}px`,
              color: `hsl(${hue} 90% 58%)`,
              animationDelay: `${(i % 26) * 0.022}s`,
            }}>{i % 2 ? "1" : "0"}</span>
          );
        })}
      </div>

      <div className="cer-core">
        <div className="cer-medal">
          <BadgeMedal code={badge.code} weight={badge.weight} earned size={190} />
        </div>
        <div className="cer-kicker">{preview ? "PREVIEW · MARK STRUCK" : "MARK STRUCK"}</div>
        <div className="cer-name">{badge.name}</div>
        <div className="cer-blurb">{badge.blurb}</div>
        <div className="cer-rar">
          {Array.from({ length: badge.weight }, (_, i) => <span key={i} />)}
          <em>RARITY {badge.weight}</em>
        </div>
      </div>

      <button className="cer-skip" onClick={onDone}>DISMISS</button>
    </div>
  );
}

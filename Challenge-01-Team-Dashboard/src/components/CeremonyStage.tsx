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
      {/* Four streams of ones and zeroes spiral in from the four sides and
          gather into a spinning ball dead centre. The medal then resolves out
          of it, fading up as the ball fades down. */}
      <div className="cer-field" aria-hidden>
        {Array.from({ length: CELLS }, (_, i) => {
          const side = i % 4;
          const t = ((i * 37) % 100) / 100;
          const from =
            side === 0 ? { x: `${(t - 0.5) * 120}vw`, y: "-62vh" } :
            side === 1 ? { x: "62vw", y: `${(t - 0.5) * 120}vh` } :
            side === 2 ? { x: `${(t - 0.5) * 120}vw`, y: "62vh" } :
                         { x: "-62vw", y: `${(t - 0.5) * 120}vh` };
          // the ball: every bit lands on a point of a small sphere
          const ang = (i / CELLS) * Math.PI * 2 * 7;
          const rad = 26 + (i % 11) * 3.4;
          return (
            <span key={i} className={`cer-bit cer-c${side}`} style={{
              ["--fx" as string]: from.x,
              ["--fy" as string]: from.y,
              ["--tx" as string]: `${Math.cos(ang) * rad}px`,
              ["--ty" as string]: `${Math.sin(ang) * rad * 0.72}px`,
              ["--spin" as string]: `${(i % 2 ? 1 : -1) * 540}deg`,
              animationDelay: `${(i % 24) * 0.021}s`,
            }}>{i % 2 ? "1" : "0"}</span>
          );
        })}
        <span className="cer-ball" />
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

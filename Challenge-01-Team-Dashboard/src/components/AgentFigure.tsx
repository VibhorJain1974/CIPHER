"use client";

import { figureOf } from "@/lib/avatars";

/**
 * The standing operative. Same seeding as the bust on the pass, so a member's
 * figure and their pass photo are recognisably the same person, but drawn
 * full height for the dossier. Build, stance and plating all vary per account,
 * which is what makes two nodes look like two different people.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
}

const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");

export default function AgentFigure({
  id, col = "var(--hot)", height = 320, live = true, name,
}: { id: string; col?: string; height?: number; live?: boolean; name?: string }) {
  const art = figureOf(id, name);
  if (art) {
    const w = Math.round(height * 0.7);
    return (
      <div style={{ position: "relative", width: w, height, overflow: "hidden", background: "var(--void)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art} alt="" style={{
          display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%",
          filter: live ? "contrast(1.05)" : "grayscale(1) brightness(.5)",
        }} />
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 52%, var(--void) 100%)" }} />
        <span className="fig-plate-scan" style={{ position: "absolute", left: 0, right: 0, height: "16%", background: `linear-gradient(180deg, transparent, ${col}55, transparent)` }} />
        <span style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1px ${col}44` }} />
        {(["tl", "tr", "bl", "br"] as const).map((k) => (
          <span key={k} style={{
            position: "absolute", width: 13, height: 13,
            [k[0] === "t" ? "top" : "bottom"]: 5,
            [k[1] === "l" ? "left" : "right"]: 5,
            [k[0] === "t" ? "borderTop" : "borderBottom"]: `1px solid ${col}`,
            [k[1] === "l" ? "borderLeft" : "borderRight"]: `1px solid ${col}`,
          } as React.CSSProperties} />
        ))}
      </div>
    );
  }

  const r = rng(id);

  const cx = 60;
  const headW = 21 + Math.round(r() * 6);
  const headH = 24 + Math.round(r() * 5);
  const shoulderW = 46 + Math.round(r() * 14);
  const waistW = 26 + Math.round(r() * 8);
  const hipY = 118 + Math.round(r() * 8);
  const stance = 5 + Math.round(r() * 7);
  const armOut = 2 + Math.round(r() * 6);
  const visorH = 4 + Math.round(r() * 3);

  const headTop = 12;
  const headBot = headTop + headH;
  const shoulderY = headBot + 8;

  const head = poly([
    [cx - headW / 2, headTop + 5], [cx - headW / 2 + 5, headTop],
    [cx + headW / 2 - 5, headTop], [cx + headW / 2, headTop + 5],
    [cx + headW / 2, headBot - 6], [cx, headBot], [cx - headW / 2, headBot - 6],
  ]);

  const torso = poly([
    [cx - shoulderW / 2, shoulderY + 6], [cx - headW / 2 + 1, shoulderY - 4],
    [cx + headW / 2 - 1, shoulderY - 4], [cx + shoulderW / 2, shoulderY + 6],
    [cx + waistW / 2, hipY], [cx - waistW / 2, hipY],
  ]);

  const arm = (side: 1 | -1) => poly([
    [cx + side * (shoulderW / 2 - 2), shoulderY + 4],
    [cx + side * (shoulderW / 2 + 7 + armOut), shoulderY + 30],
    [cx + side * (shoulderW / 2 + 5 + armOut), hipY - 2],
    [cx + side * (shoulderW / 2 - 9), hipY - 6],
    [cx + side * (shoulderW / 2 - 6), shoulderY + 22],
  ]);

  const leg = (side: 1 | -1) => poly([
    [cx + side * 2, hipY - 2],
    [cx + side * (waistW / 2 + 1), hipY - 2],
    [cx + side * (waistW / 2 + stance), 246],
    [cx + side * (waistW / 2 + stance + 5), 258],
    [cx + side * (stance + 3), 258],
    [cx + side * (stance + 1), 200],
  ]);

  // the plating: horizontal bars whose widths are the per-node fingerprint
  const bars = Array.from({ length: 34 }, (_, i) => {
    const y = headTop + i * 7.4;
    const w = 8 + r() * (shoulderW + 18);
    return { y, x: cx - w / 2, w, o: 0.16 + r() * 0.5 };
  });

  const clip = `fig-${id}`;

  return (
    <svg viewBox="0 0 120 268" height={height} width={height * (120 / 268)}
      style={{ display: "block", maxWidth: "100%" }}>
      <defs>
        <clipPath id={clip}>
          <polygon points={head} />
          <polygon points={torso} />
          <polygon points={arm(1)} />
          <polygon points={arm(-1)} />
          <polygon points={leg(1)} />
          <polygon points={leg(-1)} />
        </clipPath>
        <linearGradient id={`grd-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity={live ? 0.26 : 0.1} />
          <stop offset="100%" stopColor={col} stopOpacity={live ? 0.06 : 0.03} />
        </linearGradient>
      </defs>

      {/* ground plate */}
      <ellipse cx={cx} cy={260} rx={shoulderW * 0.9} ry={6} fill="none" stroke={col} strokeWidth="0.8" opacity={live ? 0.4 : 0.18} />
      <ellipse cx={cx} cy={260} rx={shoulderW * 0.55} ry={3.6} fill="none" stroke={col} strokeWidth="0.6" opacity={live ? 0.25 : 0.12} />

      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="120" height="268" fill={`url(#grd-${id})`} />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={3.4} fill={col}
            opacity={live ? b.o : b.o * 0.42} />
        ))}
        {/* a slow read passes down the figure, so a node at rest still breathes */}
        <rect className="fig-scan" x="0" y="-30" width="120" height="26" fill={col} opacity="0.34" />
      </g>

      {[head, torso, arm(1), arm(-1), leg(1), leg(-1)].map((p, i) => (
        <polygon key={i} points={p} fill="none" stroke={col} strokeWidth={1.1}
          opacity={live ? (i === 0 ? 0.95 : 0.72) : 0.36} />
      ))}

      {/* visor */}
      <rect x={cx - headW / 2 + 2} y={headTop + Math.round(headH * 0.44)} width={headW - 4} height={visorH}
        fill="var(--void)" stroke={col} strokeWidth="0.8" />
      <rect x={cx - headW / 2 + 3} y={headTop + Math.round(headH * 0.44) + 1.2} width={(headW - 6) * (0.32 + r() * 0.5)}
        height={visorH - 2.4} fill={col} opacity={live ? 0.95 : 0.3} />

      {/* division mark on the chest */}
      <rect x={cx - 6} y={shoulderY + 16} width={12} height={2.6} fill={col} opacity={live ? 0.9 : 0.35} />
    </svg>
  );
}

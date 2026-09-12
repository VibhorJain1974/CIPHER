"use client";

import BadgeGlyph from "./BadgeGlyph";

/**
 * A struck medal. Where rendered art exists for a mark it is used; where it
 * does not, the medal is drawn instead, to the same anatomy — hexagonal
 * plate, bevelled double rim, knurled edge, engraved symbol — so a half-
 * finished art set still reads as one collection.
 *
 * Rarity picks the alloy. Locked marks are the same object unstruck: cold,
 * unpolished, with a ring around the rim showing how close they are.
 */

/** Marks with rendered art in /public/badges. Add a code here when its PNG lands. */
const ART = new Set(["FRST", "HEVY", "POLY", "RLNT", "OPEN", "APEX"]);

const ALLOY: Record<number, { hi: string; mid: string; lo: string; rim: string }> = {
  1: { hi: "#d8c9b4", mid: "#9a8468", lo: "#4a3d2e", rim: "#c2ab8a" }, // bronze
  2: { hi: "#e4e6e6", mid: "#9aa1a4", lo: "#3f4548", rim: "#cbd1d3" }, // steel
  3: { hi: "#f3d9a4", mid: "#c79a4c", lo: "#5b421c", rim: "#e6c179" }, // brass
  4: { hi: "#ffcba0", mid: "#e0813f", lo: "#5f2c0d", rim: "#ffb37d" }, // copper
  5: { hi: "#ffd0b6", mid: "#ff4a12", lo: "#4d1405", rim: "#ff8a5c" }, // hot
};

export default function BadgeMedal({
  code, weight, earned, size = 92, progress = 0,
}: { code: string; weight: number; earned: boolean; size?: number; progress?: number }) {
  const a = ALLOY[Math.min(5, Math.max(1, weight))];
  const S = 100;
  const c = S / 2;

  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const ang = (Math.PI / 3) * i - Math.PI / 2;
      return [c + Math.cos(ang) * r, c + Math.sin(ang) * r].map((n) => n.toFixed(2)).join(",");
    }).join(" ");

  /** The ring that closes as a locked mark gets nearer. Shared by both paths. */
  const ring = !earned && progress > 0 ? (
    <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <polygon points={hex(45)} fill="none" stroke="#8a3010" strokeWidth="2.6"
        strokeDasharray={`${progress * 270} 270`}
        transform={`rotate(-90 ${c} ${c})`} opacity="0.85" />
    </svg>
  ) : null;

  // ── rendered art ────────────────────────────────────────────────
  if (ART.has(code)) {
    return (
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/badges/${code}.png`} alt="" width={size} height={size}
          style={{
            display: "block", width: size, height: size,
            filter: earned
              ? "drop-shadow(0 3px 6px rgba(0,0,0,.55))"
              : "grayscale(1) brightness(.4) contrast(.85)",
            opacity: earned ? 1 : 0.8,
          }} />
        {ring}
      </div>
    );
  }

  // ── drawn medal ─────────────────────────────────────────────────
  const uid = `${code}-${earned ? "on" : "off"}`;
  const face = earned ? a.mid : "#20262a";
  const hi = earned ? a.hi : "#39424a";
  const lo = earned ? a.lo : "#0f1417";
  const rim = earned ? a.rim : "#2b3237";

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size} style={{ display: "block", overflow: "visible", flexShrink: 0 }}>
      <defs>
        <radialGradient id={`face-${uid}`} cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="46%" stopColor={face} />
          <stop offset="100%" stopColor={lo} />
        </radialGradient>
        <linearGradient id={`rim-${uid}`} x1="14%" y1="0%" x2="86%" y2="100%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="38%" stopColor={rim} />
          <stop offset="62%" stopColor={lo} />
          <stop offset="100%" stopColor={rim} />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="72%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={earned ? 0.42 : 0.07} />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}><polygon points={hex(38)} /></clipPath>
        <filter id={`drop-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2.4" stdDeviation="2.6" floodColor="#000" floodOpacity={earned ? 0.55 : 0.3} />
        </filter>
      </defs>

      <g filter={`url(#drop-${uid})`}>
        <polygon points={hex(48)} fill={`url(#rim-${uid})`} />
        <polygon points={hex(42)} fill={lo} />
        <polygon points={hex(38)} fill={`url(#face-${uid})`} />

        {earned && Array.from({ length: 24 }, (_, i) => {
          const ang = (Math.PI * 2 * i) / 24;
          return (
            <line key={i}
              x1={c + Math.cos(ang) * 43.6} y1={c + Math.sin(ang) * 43.6}
              x2={c + Math.cos(ang) * 46.6} y2={c + Math.sin(ang) * 46.6}
              stroke={lo} strokeWidth="1.1" opacity="0.5" />
          );
        })}

        <g clipPath={`url(#clip-${uid})`}>
          <g transform={`translate(${c - 23} ${c - 23 + 1.4}) scale(${46 / 24})`} opacity={earned ? 0.55 : 0.4}>
            <BadgeGlyph code={code} size={24} col={lo} />
          </g>
          <g transform={`translate(${c - 23} ${c - 23}) scale(${46 / 24})`}>
            <BadgeGlyph code={code} size={24} col={earned ? hi : "#59636b"} />
          </g>
          <polygon points={hex(38)} fill={`url(#sheen-${uid})`} />
        </g>

        <g transform={`translate(${c - (weight * 5 - 1.5)} 84)`}>
          {Array.from({ length: weight }, (_, i) => (
            <circle key={i} cx={i * 10} cy="0" r="2.1" fill={earned ? rim : "#2b3237"} />
          ))}
        </g>

        {!earned && progress > 0 && (
          <polygon points={hex(45)} fill="none" stroke="#8a3010" strokeWidth="2.6"
            strokeDasharray={`${progress * 270} 270`}
            transform={`rotate(-90 ${c} ${c})`} opacity="0.85" />
        )}
      </g>
    </svg>
  );
}

"use client";

/**
 * Five-axis read on how a member earns, not how much. The web is always
 * drawn, so an empty file reads as an instrument at rest rather than a
 * broken panel — which matters on day one when everyone is on zero.
 */
export default function Radar({
  axes, size = 260, col = "var(--hot)",
}: {
  axes: { label: string; v: number; raw: string }[];
  size?: number; col?: string;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.34;
  const n = axes.length;
  const pt = (i: number, k: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k] as const;
  };
  const ring = (k: number) =>
    Array.from({ length: n }, (_, i) => pt(i, k).join(",")).join(" ");

  const live = axes.some((a) => a.v > 0);
  const shape = axes.map((a, i) => pt(i, Math.max(0.04, a.v)).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: "block" }}>
      {[1, 0.75, 0.5, 0.25].map((k) => (
        <polygon key={k} points={ring(k)} fill="none" stroke="var(--line)" strokeWidth={k === 1 ? 1 : 0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-2)" strokeWidth={0.6} />;
      })}

      <polygon points={shape} fill={col} fillOpacity={live ? 0.16 : 0.05} stroke={col}
        strokeWidth={live ? 1.4 : 0.8} strokeOpacity={live ? 1 : 0.4} />

      {axes.map((a, i) => {
        const [px, py] = pt(i, Math.max(0.04, a.v));
        const [lx, ly] = pt(i, 1.26);
        const anchor = Math.abs(lx - cx) < 6 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={a.label}>
            {a.v > 0 && <circle cx={px} cy={py} r={2.4} fill={col} />}
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize={7.5} letterSpacing="1.6"
              fill="var(--faint)" fontFamily="'IBM Plex Mono', monospace">{a.label}</text>
            <text x={lx} y={ly + 7} textAnchor={anchor} fontSize={9.5}
              fill={a.v > 0 ? col : "var(--dimmer)"} fontFamily="'IBM Plex Mono', monospace">{a.raw}</text>
          </g>
        );
      })}
    </svg>
  );
}

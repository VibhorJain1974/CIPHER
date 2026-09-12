"use client";

/**
 * Six-axis read on WHERE a member earns, drawn straight off the codex
 * categories rather than any invented metric. The web is always drawn, so an
 * empty file reads as an instrument at rest instead of a broken panel, which
 * matters on day one when everyone is on zero.
 *
 * The viewBox carries its own gutter because the axis labels sit outside the
 * outer ring, and a square box clips them.
 */
export default function Radar({
  axes, size = 250, col = "var(--hot)",
}: {
  axes: { label: string; v: number; raw: string }[];
  size?: number; col?: string;
}) {
  const PAD_X = 86, PAD_Y = 40;
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const n = axes.length;

  const pt = (i: number, k: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k] as const;
  };
  const ring = (k: number) =>
    Array.from({ length: n }, (_, i) => pt(i, k).join(",")).join(" ");

  const live = axes.some((a) => a.v > 0);
  const shape = axes.map((a, i) => pt(i, Math.max(0.05, a.v)).join(",")).join(" ");

  return (
    <svg
      viewBox={`${-PAD_X} ${-PAD_Y} ${size + PAD_X * 2} ${size + PAD_Y * 2}`}
      width="100%"
      style={{ maxWidth: size + PAD_X * 2, display: "block" }}
    >
      {[1, 0.75, 0.5, 0.25].map((k) => (
        <polygon key={k} points={ring(k)} fill="none" stroke="var(--line)" strokeWidth={k === 1 ? 1 : 0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-2)" strokeWidth={0.6} />;
      })}

      <polygon points={shape} fill={col} fillOpacity={live ? 0.16 : 0.05} stroke={col}
        strokeWidth={live ? 1.4 : 0.8} strokeOpacity={live ? 1 : 0.42} />

      {axes.map((a, i) => {
        const [px, py] = pt(i, Math.max(0.05, a.v));
        const [lx, ly] = pt(i, 1.2);
        const near = Math.abs(lx - cx) < r * 0.25;
        const anchor = near ? "middle" : lx > cx ? "start" : "end";
        const dy = ly < cy ? -6 : 12;
        return (
          <g key={a.label}>
            {a.v > 0 && <circle cx={px} cy={py} r={2.4} fill={col} />}
            <text x={lx} y={ly + dy} textAnchor={anchor} fontSize={7.5} letterSpacing="1.5"
              fill="var(--faint)" fontFamily="'IBM Plex Mono', monospace">{a.label}</text>
            <text x={lx} y={ly + dy + 11} textAnchor={anchor} fontSize={10}
              fill={a.v > 0 ? col : "var(--dimmer)"} fontFamily="'IBM Plex Mono', monospace">{a.raw}</text>
          </g>
        );
      })}
    </svg>
  );
}

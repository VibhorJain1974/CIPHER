"use client";

/**
 * The avatar. Nobody uploads a photo, and stock illustrations would look
 * borrowed, so each node gets a generated one instead: a masked bust built
 * out of scan bars, seeded from the account id. Same id, same face, forever,
 * and no two members can collide.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
}

export default function AgentSigil({
  id, col = "var(--hot)", size = 92, live = true,
}: { id: string; col?: string; size?: number; live?: boolean }) {
  const r = rng(id);

  // the bust: a head block and shoulders, widths jittered per node
  const headW = 26 + Math.round(r() * 8);
  const headH = 30 + Math.round(r() * 8);
  const jaw = 3 + Math.round(r() * 5);
  const shoulderW = 62 + Math.round(r() * 14);
  const visorY = 20 + Math.round(r() * 6);
  const visorH = 5 + Math.round(r() * 4);

  const cx = 50;
  const headTop = 14;
  const head = [
    [cx - headW / 2, headTop + jaw],
    [cx - headW / 2 + jaw, headTop],
    [cx + headW / 2 - jaw, headTop],
    [cx + headW / 2, headTop + jaw],
    [cx + headW / 2, headTop + headH - jaw * 2],
    [cx, headTop + headH],
    [cx - headW / 2, headTop + headH - jaw * 2],
  ].map((p) => p.join(",")).join(" ");

  const shoulders = [
    [cx - shoulderW / 2, 100],
    [cx - shoulderW / 2 + 6, 74],
    [cx - 11, 62],
    [cx + 11, 62],
    [cx + shoulderW / 2 - 6, 74],
    [cx + shoulderW / 2, 100],
  ].map((p) => p.join(",")).join(" ");

  // scan bars: the part that actually differs node to node
  const bars = Array.from({ length: 13 }, (_, i) => {
    const y = 16 + i * 6.4;
    const w = 10 + r() * (shoulderW - 16);
    return { y, x: cx - w / 2, w, o: 0.2 + r() * 0.55 };
  });

  // corner registration marks, rotated per node so the frame is unique too
  const tick = Math.round(r() * 4);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      <defs>
        <clipPath id={`bust-${id}`}>
          <polygon points={head} />
          <polygon points={shoulders} />
        </clipPath>
      </defs>

      <rect x="1" y="1" width="98" height="98" fill="none" stroke="var(--line)" strokeWidth="1" />
      {[[2, 2], [98, 2], [2, 98], [98, 98]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === tick % 4 ? 2.4 : 1.2} fill={col} opacity={i === tick % 4 ? 0.9 : 0.35} />
      ))}

      {/* the silhouette itself, flat, so the bars read against it */}
      <g clipPath={`url(#bust-${id})`}>
        <rect x="0" y="0" width="100" height="100" fill={col} opacity={live ? 0.14 : 0.07} />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={3.1} fill={col}
            opacity={live ? b.o : b.o * 0.4} />
        ))}
      </g>

      <polygon points={head} fill="none" stroke={col} strokeWidth="1.1" opacity={live ? 0.95 : 0.45} />
      <polygon points={shoulders} fill="none" stroke={col} strokeWidth="1.1" opacity={live ? 0.8 : 0.4} />

      {/* visor */}
      <rect x={cx - headW / 2 + 2} y={headTop + visorY} width={headW - 4} height={visorH}
        fill="var(--void)" stroke={col} strokeWidth="0.8" />
      <rect x={cx - headW / 2 + 3} y={headTop + visorY + 1.4} width={(headW - 6) * (0.3 + r() * 0.5)} height={visorH - 2.8}
        fill={col} opacity={live ? 0.9 : 0.3} />
    </svg>
  );
}

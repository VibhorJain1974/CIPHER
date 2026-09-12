"use client";

/**
 * One drawn mark per badge. No image assets: every glyph is geometry, so it
 * stays sharp at any size, recolours with the theme, and nothing has to be
 * supplied or licensed.
 */
export default function BadgeGlyph({
  code, size = 26, col = "var(--hot)", dim,
}: { code: string; size?: number; col?: string; dim?: boolean }) {
  const c = dim ? "var(--dimmer)" : col;
  const o = dim ? 0.6 : 1;
  const P = { fill: "none", stroke: c, strokeWidth: 1.4, opacity: o } as const;

  const art: Record<string, React.ReactNode> = {
    // first blood: a struck seal
    FRST: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 4v16" {...P} /></>,
    // killing blow: a downward spike through a bar
    KILL: <><path d="M12 2v20" {...P} /><path d="M6 8l6-6 6 6" {...P} /><path d="M4 16h16" {...P} /></>,
    // heavy hitter: stacked mass
    HEVY: <><rect x="4" y="14" width="16" height="6" {...P} /><rect x="7" y="8" width="10" height="5" {...P} /><rect x="10" y="3" width="4" height="4" {...P} /></>,
    // seven straight
    STK7: <><path d="M3 17l4-6 4 4 4-8 6 5" {...P} /><circle cx="7" cy="11" r="1.4" fill={c} opacity={o} /></>,
    // thirty straight: the same line, closed into a ring
    STK30: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 4a8 8 0 0 1 0 16" {...P} strokeWidth={2.6} /></>,
    // polymath: three fields meeting
    POLY: <><circle cx="9" cy="10" r="5" {...P} /><circle cx="15" cy="10" r="5" {...P} /><circle cx="12" cy="15" r="5" {...P} /></>,
    // relentless: repeating pulse
    RLNT: <><path d="M2 12h4l2-5 3 10 3-8 2 3h6" {...P} /></>,
    // spotless: unbroken frame
    SPTL: <><rect x="4" y="4" width="16" height="16" {...P} /><path d="M8 12l3 3 5-6" {...P} /></>,
    // archivist: a filed sheet
    ARCV: <><rect x="5" y="3" width="14" height="18" {...P} /><path d="M8 8h8M8 12h8M8 16h5" {...P} strokeWidth={1.1} /></>,
    // open hand: a merged branch
    OPEN: <><circle cx="7" cy="6" r="2.4" {...P} /><circle cx="7" cy="18" r="2.4" {...P} /><circle cx="17" cy="12" r="2.4" {...P} /><path d="M7 8.4v7.2M7 12h7.6" {...P} strokeWidth={1.1} /></>,
    // centurion: a hundred mark
    CENT: <><path d="M4 20L12 3l8 17" {...P} /><path d="M7.5 14h9" {...P} /></>,
    // apex: the point above everything
    APEX: <><path d="M12 2l9 18H3z" {...P} /><circle cx="12" cy="14" r="2.2" fill={c} opacity={o} /></>,
  };

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeLinecap="square" strokeLinejoin="miter" style={{ display: "block", flexShrink: 0 }}>
      {art[code] ?? <rect x="5" y="5" width="14" height="14" {...P} />}
    </svg>
  );
}

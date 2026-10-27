"use client";

import { useState } from "react";

// Code 128 subset B with start symbol, checksum and stop pattern.
const SYMBOLS = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232"] as const;
const MODULE = 1.6;
const VALUE_CODES = [52, 51, 42, 91, 57, 32, 45, 44, 63, 38, 17, 76, 19, 63, 44, 19, 32, 75, 83, 63, 52, 72, 19, 63, 51, 19, 67, 82, 19, 84, 63, 43, 19, 89, 93] as const;

function encode() {
  const values = [104, ...VALUE_CODES, (104 + VALUE_CODES.reduce((sum, value, index) => sum + value * (index + 1), 0)) % 103, 106];
  const bars: { x: number; width: number }[] = [];
  let x = 10 * MODULE;
  for (const value of values) {
    const pattern = value === 106 ? "2331112" : SYMBOLS[value];
    for (let i = 0; i < pattern.length; i++) {
      const width = Number(pattern[i]) * MODULE;
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { bars, width: x + 10 * MODULE };
}

export default function ArchiveBarcode() {
  const [expanded, setExpanded] = useState(false);
  const { bars, width } = encode();

  const art = (large = false) => (
    <svg
      role="img"
      aria-label="Sealed record"
      viewBox={`0 0 ${width} 100`}
      width={large ? width : "100%"}
      height={large ? 100 : 22}
      preserveAspectRatio={large ? "xMidYMid meet" : "none"}
      style={{
        display: "block",
        width: large ? width : "100%",
        height: large ? 100 : 22,
        maxWidth: "none",
        shapeRendering: "crispEdges",
      }}
    >
      <rect width={width} height="100" fill="var(--void)" />
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={large ? 7 : 3}
          width={bar.width}
          height={large ? 76 : 17}
          fill={large ? "var(--bone)" : (i % 13 === 0 ? "var(--ember)" : "var(--dimmer)")}
        />
      ))}
      {large && (
        <text
          x={width / 2}
          y="96"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="8"
          letterSpacing="3"
          fill="var(--faint)"
        >
          SEALED // RECORD 04
        </text>
      )}
    </svg>
  );

  return (
    <>
      <button
        type="button"
        title="Inspect sealed record"
        aria-label="Inspect sealed record"
        onClick={() => setExpanded(true)}
        style={{
          display: "block",
          width: "100%",
          height: 22,
          padding: 0,
          margin: 0,
          overflow: "hidden",
          border: 0,
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {art(false)}
      </button>
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded sealed record"
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(5,7,8,.97)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
            padding: 18,
          }}
        >
          <div className="lbl-faint" style={{ textAlign: "center", letterSpacing: ".24em" }}>
            ARCHIVE // SEALED
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 820,
              alignSelf: "center",
              overflowX: "auto",
              background: "var(--void)",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              padding: "12px 8px",
            }}
          >
            {art(true)}
          </div>
          <button
            className="btn"
            onClick={() => setExpanded(false)}
            style={{ alignSelf: "center", color: "var(--dim)" }}
          >
            CLOSE
          </button>
        </div>
      )}
    </>
  );
}

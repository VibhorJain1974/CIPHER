"use client";

import { useState } from "react";

// Code 128 subset B: proper start symbol, modulo-103 checksum and stop pattern.
// The scanned payload is the challenge flag; no plaintext label is rendered.
const SYMBOLS = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232"] as const;
const VALUE_CODES = [52, 51, 42, 91, 57, 32, 45, 44, 63, 38, 17, 76, 19, 63, 44, 19, 32, 75, 83, 63, 52, 72, 19, 63, 51, 19, 67, 82, 19, 84, 63, 43, 19, 89, 93] as const;

function encode() {
  const values = [104, ...VALUE_CODES, (104 + VALUE_CODES.reduce((sum, value, index) => sum + value * (index + 1), 0)) % 103, 106];
  const bars: { x: number; width: number }[] = [];
  let x = 10 * MODULE;
  for (const value of values) {
    const pattern = value === 106 ? "2331112" : SYMBOLS[value];
    for (let i = 0; i < pattern.length; i++) {
      const width = Number(pattern[i]) * 2;
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { bars, width: x + 10 * MODULE };
}

export default function ArchiveBarcode() {
  const [expanded, setExpanded] = useState(false);
  const { bars, width } = encode();
  const art = (
    <svg role="img" aria-label="Archive Code 128 barcode" viewBox={`0 0 ${width} 108`}
      width={width} height="108" style={{ display: "block", maxWidth: "none", shapeRendering: "crispEdges" }}>
      <rect width={width} height="108" fill="#f4f2ea" />
      {bars.map((bar, i) => <rect key={i} x={bar.x} y="4" width={bar.width} height="76" fill="#111313" />)}
      <text x={width / 2} y="101" textAnchor="middle" fontFamily="monospace" fontSize="10" letterSpacing="2" fill="#111313">ARCHIVE // SCAN CODE 128</text>
    </svg>
  );
  return (
    <>
      <div style={{ maxWidth: "100%", overflowX: "auto", background: "#f4f2ea", padding: "6px 8px", border: "1px solid #b4b0a6" }}>
        {art}
      </div>
      <button type="button" className="btn" onClick={() => setExpanded(true)}
        style={{ fontSize: 8, marginTop: 6, width: "100%" }}>
        EXPAND BARCODE ↗
      </button>
      {expanded && (
        <div role="dialog" aria-modal="true" aria-label="Expanded challenge barcode"
          onClick={() => setExpanded(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,7,8,.94)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: 14 }}>
          <div className="lbl" style={{ color: "#f4f2ea", textAlign: "center" }}>ARCHIVE // CODE 128</div>
          <div onClick={(event) => event.stopPropagation()}
            style={{ background: "#f4f2ea", padding: 8, maxWidth: "100%", overflowX: "auto" }}>
            {art}
          </div>
          <button className="btn btn-hot" onClick={() => setExpanded(false)} style={{ alignSelf: "center" }}>CLOSE</button>
        </div>
      )}
    </>
  );
}

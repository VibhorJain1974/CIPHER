"use client";

const CODE = "BaAbAdBaCcAaBaCaAcAaBaCcDaBaBaCaBaAcBcBaBaAaCaBcAcBaCaAaAbBdAcBcAaAbCbBaBbAaAdBbAaCbAaAbBdAcBaCaBbAaCbBcBaBaBdAbAaAaDbAbAaAbBdBaCcAaAbBdAaBbAaCbAaAbBdBaCaAcBbAaCbAdAaBbAbAbDaBbAaCbAbDaAbAaAbBdAaBcCaBbAaCbBaBaDaAaAcDaAaAdBbBcCaAaB";
const MODULE = 2.5;

export default function ArchiveBarcode() {
  let x = 12;
  const bars: { x: number; width: number }[] = [];
  for (const unit of CODE) {
    const width = (unit.toLowerCase().charCodeAt(0) - 96) * MODULE;
    if (unit >= "A" && unit <= "Z") bars.push({ x, width });
    x += width;
  }
  const width = x + 12;
  return (
    <div style={{ maxWidth: "100%", overflowX: "auto", background: "#f4f2ea", padding: "5px 6px 3px" }}>
      <svg role="img" aria-label="Archive barcode" viewBox={`0 0 ${width} 56`}
        width={width} height="56" style={{ display: "block", maxWidth: "none" }}>
        <rect width={width} height="56" fill="#f4f2ea" />
        {bars.map((bar, i) => <rect key={i} x={bar.x} y="3" width={bar.width} height="44" fill="#111313" />)}
        <text x={width / 2} y="54" textAnchor="middle" fontFamily="monospace" fontSize="7" letterSpacing="1.5" fill="#111313">ARCHIVE // SCAN</text>
      </svg>
    </div>
  );
}

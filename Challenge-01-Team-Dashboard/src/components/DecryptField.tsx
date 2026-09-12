"use client";

import { useEffect, useRef } from "react";

/**
 * Everything readable in the field. Each screen row gets one of these,
 * centred, so wherever the cursor lands you get a whole clean line rather
 * than a smear of letters.
 */
const LINES = [
  "CODE   DECODE   BEAT   REPEAT",
  "SAME MINDS   HIGHER HORIZONS",
  "ANALYZE   DECODE   BUILD   CONQUER",
  "NO PROOF   NO POINTS",
  "BREAK IT   LOG IT   OWN IT",
  "WE DO NOT AVERAGE",
  "ECHO CANNOT READ THIS",
  "SHIP   VERIFY   ASCEND",
  "0x43 49 50 48 45 52",
  "QUIET HANDS   LOUD LEDGER",
  "FLSKHU   <<   SHIFT IT BACK THREE",
  "PROVE IT OR IT DID NOT HAPPEN",
  "01000011 01001001 01010000 01001000",
  "FIND THE PATTERN   TAKE THE SLOT",
  "NO PUBLIC ROUTE",
  "SEALED   SIGNED   SCORED",
  "THE QUIET ONES ARE COUNTING",
  "DECRYPT   THEN DOMINATE",
  "TSJ 2026   75 DAYS   15.11",
  "BUILT IN THE DARK   READ IN THE LIGHT",
  "IF YOU FOUND THIS YOU LOOKED LONGER THAN MOST",
  "FIVE TEAMS   ONE LEDGER   ONE WINNER",
  "COUNT NOTHING TWICE",
  "KEY EXCHANGE COMPLETE",
  "NOTHING HERE IS AVERAGED",
  "EARN IT   LOG IT   BANK IT",
  "EIGHT NODES   ONE SIGNAL",
];

export default function DecryptField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const CW = 14, CH = 21;
    const RX = 210, RY = 54;       // beam is a wide lozenge: you read a line, not a blob
    let cols = 0, rows = 0, dpr = 1;
    let bits: Uint8Array = new Uint8Array(0);
    let plane: string[] = [];
    let bold: Uint8Array = new Uint8Array(0);   // the hidden team mark
    let speed: Float32Array = new Float32Array(0);
    let offset: Float32Array = new Float32Array(0);
    const mouse = { x: -9999, y: -9999 };
    let raf = 0, last = 0;

    let sprite0: HTMLCanvasElement | null = null;
    let sprite1: HTMLCanvasElement | null = null;
    let spriteKey = "";

    function makeSprites(colour: string) {
      const build = (ch: string) => {
        const c = document.createElement("canvas");
        c.width = Math.ceil(CW * dpr); c.height = Math.ceil(CH * dpr);
        const g = c.getContext("2d")!;
        g.scale(dpr, dpr);
        g.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
        g.textBaseline = "top";
        g.fillStyle = colour;
        g.fillText(ch, 0, 4);
        return c;
      };
      sprite0 = build("0");
      sprite1 = build("1");
      spriteKey = colour + "@" + dpr;
    }

    function layout() {
      if (!cv || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = cv.clientWidth, h = cv.clientHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / CW) + 1;
      rows = Math.ceil(h / CH) + 2;

      bits = new Uint8Array(cols * rows);
      for (let i = 0; i < bits.length; i++) bits[i] = Math.random() < 0.5 ? 0 : 1;

      speed = new Float32Array(cols);
      offset = new Float32Array(cols);
      for (let c = 0; c < cols; c++) {
        const dir = c % 2 === 0 ? 1 : -1;           // one column down, the next up
        speed[c] = dir * (12 + ((c * 37) % 17));
        offset[c] = Math.random() * rows * CH;
      }

      // Each row carries one phrase, tiled edge to edge. Centring a single
      // copy left the sides blank, so hovering anywhere but the middle
      // decrypted nothing. Every row also starts at a different point in
      // its own loop, which stops neighbouring rows lining up into columns.
      plane = [];
      for (let r = 0; r < rows; r++) {
        const text = LINES[r % LINES.length] + "     ";
        const phase = (r * 11) % text.length;
        let line = text.slice(phase);
        while (line.length < cols) line += text;
        plane.push(line.slice(0, cols));
      }

      // ── the hidden mark ──────────────────────────────────────────
      // Not tiled, not repeated. Two placements on the whole field, in
      // bold. You have to sweep for it, and when it lands it reads as a
      // signature rather than more wallpaper.
      bold = new Uint8Array(cols * rows);
      const MARK = "TEAM CIPHER";
      const spots = 2;
      for (let k = 0; k < spots; k++) {
        const band = Math.floor(rows / spots);
        const r = Math.min(rows - 1, Math.floor(band * k + 2 + Math.random() * Math.max(1, band - 4)));
        const c0 = Math.max(0, Math.floor(Math.random() * Math.max(1, cols - MARK.length - 2)));
        const row = plane[r];
        plane[r] = (row.slice(0, c0) + MARK + row.slice(c0 + MARK.length)).slice(0, cols);
        for (let i = 0; i < MARK.length; i++) {
          if (MARK[i] !== " ") bold[r * cols + c0 + i] = 1;
        }
      }

      spriteKey = "";
    }

    function frame(t: number) {
      if (!cv || !ctx) return;
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;

      const w = cv.clientWidth, h = cv.clientHeight;
      const st = getComputedStyle(document.documentElement);
      const bg   = st.getPropertyValue("--void").trim() || "#0b0d0e";
      const dim  = st.getPropertyValue("--noise").trim() || "#2b3134";
      const hot  = st.getPropertyValue("--hot").trim()  || "#ff4a12";
      const bone = st.getPropertyValue("--bone").trim() || "#e6e1d6";

      if (spriteKey !== dim + "@" + dpr) makeSprites(dim);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ── pass 1: the ciphertext, scrolling vertically per column ──
      const span = rows * CH;
      for (let c = 0; c < cols; c++) {
        offset[c] = (offset[c] + speed[c] * dt) % span;
        if (offset[c] < 0) offset[c] += span;

        const shift = offset[c];
        const cellShift = Math.floor(shift / CH);
        const px = shift - cellShift * CH;
        const x = c * CW;

        for (let r = -1; r < rows; r++) {
          const y = r * CH + px;
          if (y < -CH || y > h) continue;
          const bi = (((r + cellShift) % rows) + rows) % rows;
          const sp = bits[bi * cols + c] ? sprite1 : sprite0;
          if (sp) ctx.drawImage(sp, x, y, CW, CH);
        }
      }

      // ── pass 2: the plaintext, on a FIXED grid, over the top ──
      // it must not scroll or you cannot read it: the noise moves,
      // the message holds still
      if (mouse.x > -1000) {
        ctx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.textBaseline = "top";

        const r0 = Math.max(0, Math.floor((mouse.y - RY) / CH));
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + RY) / CH));
        const c0 = Math.max(0, Math.floor((mouse.x - RX) / CW));
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + RX) / CW));

        for (let r = r0; r <= r1; r++) {
          const row = plane[r];
          if (!row) continue;
          const y = r * CH;
          for (let c = c0; c <= c1; c++) {
            const ch = row[c];
            if (!ch || ch === " ") continue;
            const x = c * CW;
            const nx = (x + CW / 2 - mouse.x) / RX;
            const ny = (y + CH / 2 - mouse.y) / RY;
            const d = Math.hypot(nx, ny);
            if (d >= 1) continue;

            const near = 1 - d;
            // punch the noise out behind the glyph so it reads cleanly
            ctx.fillStyle = bg;
            ctx.fillRect(x - 1, y + 2, CW + 1, CH - 3);
            const isMark = bold[r * cols + c] === 1;
            if (isMark) {
              ctx.font = "700 11px 'IBM Plex Mono', ui-monospace, monospace";
              ctx.globalAlpha = Math.min(1, 0.6 + near * 1.2);
              ctx.fillStyle = hot;
            } else {
              ctx.globalAlpha = Math.min(1, 0.35 + near * 1.4);
              ctx.fillStyle = near > 0.45 ? hot : bone;
            }
            ctx.fillText(ch, x, y + 4);
            if (isMark) ctx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
            ctx.globalAlpha = 1;
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      const rect = cv!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    layout();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", layout);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />
  );
}

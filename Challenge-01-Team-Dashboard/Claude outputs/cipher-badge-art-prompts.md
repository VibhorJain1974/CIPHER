# CIPHER marks — image generation prompts

I can't generate images in this session, so these are written to be pasted straight
into Midjourney, DALL·E, Firefly, Leonardo or Nano Banana. Generate them, send me the
PNGs, and I'll drop them into the cards. The generated SVG medals stay as the fallback,
so nothing breaks if you only do some of them.

## How to use

Paste the **style block** first, then one **mark line**. Every prompt is written for a
square image on a dark ground so it sits straight onto the card art plate.

Ask for **1024×1024 PNG, transparent or near-black background**. Name each file by its
code: `FRST.png`, `KILL.png`, and so on.

If your tool has a style-reference or `--sref` slot, generate **FRST first**, then feed
that image back as the reference for the other eleven. That is what keeps the set
looking like one collection instead of twelve unrelated pictures, which is the whole
point of the Apple Fitness badges.

---

## Style block (prepend to every prompt)

> A single achievement medal rendered as a 3D object, centred, floating on a near-black
> background. Hexagonal plate, point up, with a bevelled double rim and a milled knurled
> edge like a struck coin. Brushed metal face with a soft radial sheen and one specular
> highlight from the upper left. The central symbol is embossed into the metal, raised
> and catching light, not printed on. Restrained palette: gunmetal and a single hot
> orange accent (#FF4A12) used sparingly as rim light and glow. Physically based
> rendering, soft studio lighting, shallow depth, crisp edges, subtle contact shadow
> beneath. Clean, weighty, collectible. No text, no lettering, no numbers, no ribbons,
> no laurel wreaths, no background scenery. Square composition, product shot.

Add at the end of every prompt: `--ar 1:1 --style raw` (Midjourney) or just ask for a
square image.

---

## The twelve marks

Rarity sets the alloy. Keep it: it's how someone reads difficulty at a glance.

| # | Code | Name | Rarity | Alloy |
|---|------|------|--------|-------|
| 1 | FRST | FIRST BLOOD | 1 | bronze |
| 2 | STK7 | SEVEN STRAIGHT | 2 | steel |
| 3 | HEVY | HEAVY HITTER | 3 | brass |
| 4 | POLY | POLYMATH | 3 | brass |
| 5 | RLNT | RELENTLESS | 3 | brass |
| 6 | OPEN | OPEN HAND | 3 | brass |
| 7 | SPTL | SPOTLESS | 4 | copper |
| 8 | ARCV | ARCHIVIST | 4 | copper |
| 9 | CENT | CENTURION | 4 | copper |
| 10 | KILL | KILLING BLOW | 5 | hot orange |
| 11 | STK30 | THIRTY STRAIGHT | 5 | hot orange |
| 12 | APEX | APEX | 5 | hot orange |

---

**1. FRST — FIRST BLOOD** *(bronze)*
> ...embossed symbol: a circle cut clean in half by a single vertical line, like a wax
> seal broken down the middle. Aged bronze alloy, warm and dark in the recesses. The
> break line catches a thin orange rim light.

**2. STK7 — SEVEN STRAIGHT** *(steel)*
> ...embossed symbol: a jagged ascending line, seven short segments, like a ridge
> traced across the face. Cold brushed steel, blue-grey, sharp highlights. One orange
> point marks the start of the climb.

**3. HEVY — HEAVY HITTER** *(brass)*
> ...embossed symbol: three stacked blocks, widest at the bottom, narrowest on top,
> like a struck anvil weight. Warm brass, deep shadow under each block so the stack
> reads as genuinely heavy.

**4. POLY — POLYMATH** *(brass)*
> ...embossed symbol: three overlapping circles meeting in the centre, the overlaps
> raised higher than the rest. Warm brass. The shared centre glows faint orange.

**5. RLNT — RELENTLESS** *(brass)*
> ...embossed symbol: a continuous pulse line, one tall spike among small even beats,
> running edge to edge across the face. Warm brass, the spike polished brighter than
> the flat.

**6. OPEN — OPEN HAND** *(brass)*
> ...embossed symbol: three nodes joined by lines, two on the left stacked vertically,
> one on the right, like a branch merging. Warm brass, each node a polished dome.

**7. SPTL — SPOTLESS** *(copper)*
> ...embossed symbol: a square frame with a clean check mark inside, both raised, the
> frame unbroken on all four sides. Polished copper, flawless mirror finish with no
> pitting anywhere, which is the point.

**8. ARCV — ARCHIVIST** *(copper)*
> ...embossed symbol: an upright sheet with three horizontal ruled lines, the top edge
> slightly curled. Copper with a dark patina in the ruled channels.

**9. CENT — CENTURION** *(copper)*
> ...embossed symbol: a tall narrow letter A form, a peak with a crossbar, rendered as
> a monument rather than a letter. Copper, hard directional light down one face.

**10. KILL — KILLING BLOW** *(hot orange)*
> ...embossed symbol: a vertical spike driven downward through a horizontal bar,
> splitting it. Dark gunmetal plate with molten orange bleeding out of the split and
> glowing in the cracks. The hottest medal in the set.

**11. STK30 — THIRTY STRAIGHT** *(hot orange)*
> ...embossed symbol: an unbroken ring, thick and heavy, with no seam anywhere on it.
> Dark gunmetal plate, the ring itself glowing hot orange as though still cooling from
> the strike.

**12. APEX — APEX** *(hot orange)*
> ...embossed symbol: a solid triangle, point up, with a single raised dot at its
> centre. Dark gunmetal plate, a hard orange rim light along the top two edges and a
> long shadow below. It should look like it sits above everything else in the set.

---

## Sealed versions

You don't need to generate these. The card dims and desaturates the struck art for the
locked state and draws a progress ring around the rim, so one image per mark covers both.

If you'd rather art-direct the locked look yourself, regenerate each with:

> ...the same medal, unstruck: cast in cold grey pewter, no polish, no orange anywhere,
> the symbol barely raised, lit flatly from above. It should look like a blank waiting
> to be struck.

Name those `FRST-sealed.png` and so on.

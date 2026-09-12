# CIPHER crew — image generation prompts

Same deal as the marks: I can't generate images here, so these are written to paste
straight into Midjourney, DALL·E, Firefly, Leonardo or Nano Banana. Generate, send me
the PNGs, and I'll wire them in. The generated vector avatars stay as the fallback so
a half-finished set still works.

There are two separate jobs here. Do them in this order.

---

# Job 1 — the six crew avatars

One portrait per member. These replace the vector sigil on the pass and the standing
figure on the dossier, so they have to look like one squad photographed the same day,
not six unrelated characters. **That consistency is the whole job.**

## How to get a set instead of six strangers

1. Generate **Vibbhor** first. Iterate until you love it. That one image sets the
   entire look.
2. Feed it back as a style reference (`--sref` in Midjourney, "reference image" or
   "style match" elsewhere) for the other five.
3. Keep the style block byte-identical every time. Only the character line changes.
4. Ask for **1024×1024 PNG, transparent background** if your tool supports it,
   otherwise flat near-black `#0B0D0E`. Name them `vibbhor.png`, `harsh.png`,
   `kartik.png`, `ridhi.png`, `tavishi.png`, `anushka.png`.

## Style block (prepend to every avatar prompt)

> Bust portrait of a masked operative, head and shoulders, facing forward, centred on a
> near-black background. Full-face visor helmet, no skin and no facial features visible,
> anonymous by design. Matte gunmetal armour with fine panel seams and a single thin
> strip of hot orange light (#FF4A12) tracing one edge of the helmet. Cold rim light
> from behind, one soft key light from the upper left, deep shadow everywhere else.
> Restrained palette: gunmetal, bone white, one orange accent. Clean industrial design,
> physically based rendering, sharp panel edges, no chrome, no neon glow flooding the
> frame, no weapons, no logos, no text, no lettering. Square composition, tight crop,
> shallow depth of field.

Add `--ar 1:1 --style raw` on Midjourney.

## The six

Each line describes what makes that person distinguishable at a glance, and each one
carries their division colour as a secondary accent. Keep the divisions straight, they
already drive the dashboard.

**VIBBHOR JAIN — OPS COMMAND** *(generate this one first)*
> ...the squad leader. Broader shoulders, a heavier collar with a raised command ridge
> across the back of the neck. Helmet visor is a single wide horizontal band. Ash-grey
> secondary accent on the shoulder plates. Carries the most authority of the six without
> being ornate.

**HARSH GUPTA — HEX DIVISION**
> ...the breaker. Angular faceted helmet with hexagonal panel seams across the crown.
> Visor is a narrow slit, lit brighter than the others. Hot orange is the secondary
> accent as well as the primary, this is the only one where orange dominates.

**KARTIK SHARMA — GRID DIVISION**
> ...the builder. Smoother rounded helmet with a fine grid of vent perforations across
> one side. Visor is a rectangular plate with a thin readout line. Olive-green secondary
> accent (#9FA06A) along the jaw seam.

**RIDHI JAISWAL — PRISM DIVISION**
> ...the designer. Sleeker, lighter armour with fewer panels and cleaner curves. Visor
> is faceted like a cut gemstone, catching light across several planes. Muted
> terracotta secondary accent (#A8705F).

**TAVISHI JAIN — QUANTUM ARCHIVE**
> ...the researcher. Helmet with a raised sensor ridge over the crown and a small array
> of fine antennae at the temple. Visor is a tall narrow oval. Sage-grey secondary
> accent (#7F9086).

**ANUSHKA ARORA — NEURAL DIVISION**
> ...the analyst. Helmet with fine branching filament traces running across the shell
> like a circuit. Visor is a wide curved band with a faint scan pattern. Warm copper
> secondary accent (#C07A4E).

## Standing-figure versions (optional, do these second)

If you want the big dossier figure to be art too, regenerate each with the bust line
swapped for this, keeping everything else identical:

> Full body standing portrait, feet on the ground, arms relaxed at the sides, facing
> forward, centred. Same helmet and armour as the bust. Full figure visible head to
> boots, vertical composition.

Ask for **832×1216 portrait PNG** and name them `vibbhor-full.png` and so on.

---

# Job 2 — the CREW screen backdrop

One image, used behind the whole roster. It must stay quiet: the cards sit on top of it
and have to stay readable.

> A wide, very dark environment plate for a UI background. A vast empty hangar floor in
> near-black gunmetal, seen from a low angle, with a faint orthogonal grid of light
> etched into the floor receding into darkness. A single cold shaft of light from
> somewhere above left. Thin hot orange (#FF4A12) edge lighting on a few distant
> structural beams, nothing else. Almost entirely black across the middle of the frame,
> heavy atmospheric haze, deep negative space. No characters, no text, no logos, no
> focal subject. Cinematic, restrained, low contrast in the centre where UI will sit.

Ask for **2560×1440 PNG**. Name it `crew-backdrop.png`.

If it comes back too busy, add "even darker, more empty, remove detail from the centre
of the frame" and regenerate. For a backdrop, too quiet is always safer than too loud.

---

## What I do with them

Drop the files on me and I'll:

- put the avatars on the pass and the dossier figure, keeping the generated vector as
  the fallback for anyone without art yet
- lay the backdrop behind CREW at low opacity with a dark wash over it so the cards
  keep their contrast
- keep every division colour, badge and layout exactly as it is now

One warning worth having up front: generated portraits will drift in style even with a
reference image. If two come back looking like they belong to different games, send me
both and I'll tell you which one to regenerate rather than shipping a mismatched squad.

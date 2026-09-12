/**
 * Rendered portraits. A member with art here gets it on their pass, their
 * crew card and their dossier; everyone else gets the generated sigil, which
 * is why a half-finished set still looks deliberate.
 *
 * Two ways to match, and the id always wins. The name fallback exists so a
 * portrait drawn before someone enrols lights up the moment they do, without
 * anyone having to come back and paste an account id.
 */
const BY_ID: Record<string, string> = {
  "bc2cd4a3-f883-41b3-b402-c8e2dd317e73": "vibbhor",  // Vibbhor Jain
  "d80243c5-4aa6-4d44-be0e-7baa3a3ad775": "harsh",    // Harsh Gupta
  "0d85e0d3-d957-43e6-aa22-44875edbd1ab": "kartik",   // Kartik Sharma
  "409b6b21-b4e5-4fbd-b2eb-25a3c0f728a8": "ridhi",    // Ridhi Jaiswal
};

/** First name, lower case. Used only when the id is not listed above. */
const BY_NAME: Record<string, string> = {
  vibbhor: "vibbhor",
  harsh: "harsh",
  kartik: "kartik",
  ridhi: "ridhi",
  tavishi: "tavishi",
  anushka: "anushka",
  apurva: "apurva",
  ebnay: "ebnay",
  tanvi: "tanvi",
  manthan: "manthan",
};

/** Members with a full-length render as well as a bust. */
const FULL = new Set([
  "vibbhor", "harsh", "kartik", "ridhi", "tavishi", "anushka",
  "apurva", "ebnay", "tanvi", "manthan",
]);

function slugFor(id: string, name?: string): string | null {
  const byId = BY_ID[id];
  if (byId) return byId;
  const first = (name ?? "").trim().split(/\s+/)[0]?.toLowerCase();
  return (first && BY_NAME[first]) || null;
}

/** The bust, for passes and crew cards. */
export function avatarOf(id: string, name?: string): string | null {
  const slug = slugFor(id, name);
  return slug ? `/avatars/${slug}.png` : null;
}

/** The standing figure, for the dossier. Falls back to the bust. */
export function figureOf(id: string, name?: string): string | null {
  const slug = slugFor(id, name);
  if (!slug) return null;
  return FULL.has(slug) ? `/avatars/${slug}-full.png` : `/avatars/${slug}.png`;
}

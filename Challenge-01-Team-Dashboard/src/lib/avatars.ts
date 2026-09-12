/**
 * Rendered portraits, by account id. A member with art here gets it on their
 * pass, their crew card and their dossier; everyone else gets the generated
 * sigil, which is why a half-finished set still looks deliberate.
 *
 * To add one: drop the PNG in /public/avatars and add the id below.
 * Ids come from `select id, full_name from profiles`.
 */
export const AVATARS: Record<string, string> = {
  "bc2cd4a3-f883-41b3-b402-c8e2dd317e73": "vibbhor.png", // Vibbhor Jain
};

export function avatarOf(id: string): string | null {
  const f = AVATARS[id];
  return f ? `/avatars/${f}` : null;
}

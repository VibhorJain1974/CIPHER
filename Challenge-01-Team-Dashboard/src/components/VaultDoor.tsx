"use client";

/**
 * The way in. Two blast doors meet down the middle with the CIPHER shield
 * split across the seam; clearing the gate parts them and the board is behind.
 *
 * The shield is one image drawn twice, each half clipped to its own door and
 * offset so the two halves line up exactly on the seam. Splitting the file
 * itself would drift the moment the logo is replaced.
 */
export default function VaultDoor({ open }: { open: boolean }) {
  return (
    <div className={`vault${open ? " vault-open" : ""}`} aria-hidden>
      <div className="vault-half vault-l">
        <div className="vault-skin" />
        <div className="vault-logo"><img src="/cipher-shield.png" alt="" /></div>
        <div className="vault-edge" />
      </div>

      <div className="vault-half vault-r">
        <div className="vault-skin" />
        <div className="vault-logo"><img src="/cipher-shield.png" alt="" /></div>
        <div className="vault-edge" />
      </div>

      {/* the seam only glows while the doors are actually moving */}
      <div className="vault-seam" />
    </div>
  );
}

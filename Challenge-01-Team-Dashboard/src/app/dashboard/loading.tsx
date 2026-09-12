/**
 * Shown the instant navigation into the dashboard starts, while the layout's
 * server component is still reading the session and the profile. Without
 * this, Next paints nothing at all for that stretch — which is the black
 * screen after the vault doors open. This keeps the same void background
 * and the doors' own accent colour, so it reads as a continuation of the
 * opening, not a broken page.
 */
export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--void)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div className="dash-loading-ring" aria-hidden />
        <div className="lbl-hot" style={{ fontSize: 10, letterSpacing: ".24em" }}>
          DECRYPTING BOARD…
        </div>
      </div>
    </div>
  );
}

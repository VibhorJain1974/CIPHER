"use client";

import { useEffect } from "react";

/**
 * Root-level net. dashboard/error.tsx catches crashes inside the dashboard
 * segment; this one catches everything outside it — login, signup, enrol —
 * so a render exception there also ends up as a visible screen instead of
 * whatever the page's own dark background happens to be.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--void)",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <div className="lbl-hot" style={{ fontSize: 11, letterSpacing: ".24em" }}>
          SOMETHING WENT WRONG
        </div>
        <div className="lbl-faint" style={{ fontSize: 11, lineHeight: 1.7 }}>
          This screen hit an error before it could draw. Try again, or go
          back to sign in.
        </div>
        <button className="btn btn-hot" onClick={() => reset()} style={{ marginTop: 4 }}>
          TRY AGAIN
        </button>
        <a href="/login" className="lbl-faint" style={{ fontSize: 10, color: "var(--hot)" }}>
          Back to sign in
        </a>
      </div>
    </div>
  );
}

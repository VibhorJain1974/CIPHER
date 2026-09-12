"use client";

import { useEffect } from "react";

/**
 * Without this file, any exception thrown while rendering a dashboard page
 * unmounts the whole React tree with nothing left behind but the page's own
 * dark background — which is indistinguishable from the void screen shown
 * mid-navigation. That is very likely what "black screen after the gate"
 * actually was: not a slow transition, but a crash with no boundary to
 * catch it. This gives that crash a visible, recoverable screen instead.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
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
          BOARD DID NOT DECRYPT
        </div>
        <div className="lbl-faint" style={{ fontSize: 11, lineHeight: 1.7 }}>
          Something on this screen broke before it could draw. This is a bug,
          not a rejected login — reloading almost always clears it.
        </div>
        <button className="btn btn-hot" onClick={() => reset()} style={{ marginTop: 4 }}>
          TRY AGAIN
        </button>
        <a href="/dashboard/home" className="lbl-faint" style={{ fontSize: 10, color: "var(--hot)" }}>
          Or go to the home screen
        </a>
      </div>
    </div>
  );
}

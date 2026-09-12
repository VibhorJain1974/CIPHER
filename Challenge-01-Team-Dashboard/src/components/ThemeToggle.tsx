"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/** One click. Remembered per browser. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (() => {
      try { return localStorage.getItem("cipher-theme") as Theme | null; }
      catch { return null; }
    })();
    setTheme(stored ?? "dark");
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("cipher-theme", next); } catch { /* private mode */ }
  }

  return (
    <button onClick={flip} title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className="lbl"
      style={{
        background: "none", border: "1px solid var(--line)", cursor: "pointer",
        color: "var(--dim)", padding: "3px 8px", fontSize: 9, letterSpacing: ".14em",
        lineHeight: 1.6,
      }}>
      {theme === "dark" ? "☾ DARK" : "☀ LIGHT"}
    </button>
  );
}

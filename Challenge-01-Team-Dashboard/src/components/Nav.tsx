"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { daysLeft } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import SignalBar from "./SignalBar";

interface Item { key: string; href: string }

export default function Nav({
  items, name, role, selfId,
}: { items: Item[]; name: string; role: string; selfId: string }) {
  const path = usePathname();
  const [held, setHeld] = useState(0);
  const [clock, setClock] = useState("--:--:--");
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    createClient().from("team_latent").select("held_count").single()
      .then(({ data }) => setHeld(data?.held_count ?? 0));
  }, [path]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock([d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, "0")).join(":"));
      setLeft(daysLeft());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isCore = role === "core";
  const isJudge = role === "judge";
  const urgent = left !== null && left <= 14;

  async function sever() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  // QUEU lives at /dashboard/core and KEYS at /dashboard/core/access, so a
  // plain prefix test lights both. Only the longest match wins.
  const activeKey = (() => {
    if (path.startsWith("/dashboard/profile")) return "FILE";
    let best: string | null = null;
    let bestLen = -1;
    for (const n of items) {
      if (n.key === "FILE") continue;
      const hit = n.href === "/dashboard"
        ? path === "/dashboard"
        : path === n.href || path.startsWith(n.href + "/");
      if (hit && n.href.length > bestLen) { best = n.key; bestLen = n.href.length; }
    }
    return best;
  })();

  return (
    <header style={{ borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 30, background: "var(--void)" }}>
      <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", flexWrap: "wrap" }}>

        <Link href="/dashboard/leaderboard"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderRight: "1px solid var(--line)", color: "var(--bone)" }}>
          <span style={{ width: 10, height: 10, background: "var(--hot)", display: "inline-block" }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: ".24em" }}>CIPHER</span>
          <span className="lbl-faint" style={{ fontSize: 9 }}>TSJ·26</span>
        </Link>

        <nav style={{ display: "flex", flex: 1, minWidth: 260, overflowX: "auto" }}>
          {items.map((n) => {
            const href = n.key === "FILE" ? `/dashboard/profile/${selfId}` : n.href;
            const active = activeKey === n.key;
            return (
              <Link key={n.key} href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "14px 18px", borderRight: "1px solid var(--line-2)",
                  whiteSpace: "nowrap", fontSize: 10, letterSpacing: ".2em",
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: active ? "var(--bone)" : "transparent",
                  color: active ? "var(--void)" : "var(--dim)",
                }}>
                {n.key}
                {n.key === "QUEU" && held > 0 && (
                  <span className="val" style={{ fontSize: 11, color: active ? "var(--void)" : "var(--hot)" }}>{held}</span>
                )}
              </Link>
            );
          })}
          <button onClick={sever}
            style={{
              padding: "14px 18px", borderRight: "1px solid var(--line-2)", border: "none",
              background: "transparent", color: "var(--hot)", cursor: "pointer",
              fontSize: 10, letterSpacing: ".2em", fontFamily: "'IBM Plex Mono', monospace",
            }}>
            ×SEAL
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", borderLeft: "1px solid var(--line)" }}>
          <span className="lbl" style={{ fontSize: 10 }}>{name.toUpperCase()}</span>
          <span className="lbl" style={{ fontSize: 10, color: isCore ? "var(--hot)" : isJudge ? "var(--bone)" : "var(--dimmer)" }}>
            {isCore ? "CORE" : isJudge ? "JDG" : "MBR"}
          </span>
          <span className="lbl-faint val" style={{ fontSize: 10 }}>{clock}</span>
          <span className="lbl val" style={{ fontSize: 10, color: urgent ? "var(--hot)" : "var(--faint)" }}>D−{left ?? "--"}</span>
          <SignalBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

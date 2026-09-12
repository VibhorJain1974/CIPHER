"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { badgesFor } from "@/lib/badges";

interface Signal {
  id: number; kind: "mark" | "clear" | "enrol";
  actor_id: string | null; code: string | null;
  title: string | null; points: number | null; created_at: string;
}

const MARKS = badgesFor({ entries: [], total: 0, voided: 0, isTop: false });
const markName = (c: string | null) => MARKS.find((m) => m.code === c)?.name ?? c ?? "";

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "NOW";
  if (s < 3600) return `${Math.floor(s / 60)}M`;
  if (s < 86400) return `${Math.floor(s / 3600)}H`;
  return `${Math.floor(s / 86400)}D`;
}

/**
 * The team feed. Everything that happens on the board lands here for
 * everyone: a mark struck, an entry cleared, a node enrolled. Live over a
 * realtime channel, so it arrives while the page is open rather than on the
 * next refresh. The unread count is per browser, which is the right scope
 * for a "you have not looked at this yet" dot.
 */
export default function SignalBar() {
  const [rows, setRows] = useState<Signal[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number>(0);
  const [toast, setToast] = useState<Signal | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    setSeen(Number(localStorage.getItem("cipher.signals.seen") ?? 0));

    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        sb.from("signals").select("*").order("created_at", { ascending: false }).limit(40),
        sb.from("profiles").select("id, full_name"),
      ]);
      setRows((s as Signal[]) ?? []);
      const map: Record<string, string> = {};
      (p ?? []).forEach((r) => { map[r.id as string] = r.full_name as string; });
      setNames(map);
    })();

    const ch = sb.channel("signals-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "signals" }, (payload) => {
        const row = payload.new as Signal;
        setRows((r) => [row, ...r].slice(0, 40));
        setToast(row);
        setTimeout(() => setToast((t) => (t?.id === row.id ? null : t)), 6000);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const unread = rows.filter((r) => r.id > seen).length;

  function openPanel() {
    setOpen((o) => !o);
    if (!open && rows.length) {
      const top = rows[0].id;
      setSeen(top);
      localStorage.setItem("cipher.signals.seen", String(top));
    }
  }

  const line = (r: Signal) => {
    const who = (r.actor_id && names[r.actor_id]) || "A NODE";
    if (r.kind === "mark") return <>{who.toUpperCase()} STRUCK <b>{markName(r.code)}</b></>;
    if (r.kind === "enrol") return <>{who.toUpperCase()} JOINED THE BOARD</>;
    return <>{who.toUpperCase()} CLEARED <b>{(r.title ?? "").toUpperCase()}</b>{r.points ? <> +{r.points}</> : null}</>;
  };

  return (
    <div ref={box} style={{ position: "relative" }}>
      <button onClick={openPanel} className="sig-btn" aria-label="signals">
        SIG{unread > 0 && <span className="sig-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="sig-panel">
          <div className="sig-head">
            <span className="lbl-hot" style={{ fontSize: 9 }}>SIGNALS</span>
            <span className="lbl-faint" style={{ fontSize: 8 }}>EVERYTHING THE BOARD SEES</span>
          </div>
          {rows.length === 0 ? (
            <div className="sig-empty">NOTHING HAS HAPPENED YET<span className="caret">_</span></div>
          ) : rows.map((r) => (
            <Link key={r.id} href={r.actor_id ? `/dashboard/profile/${r.actor_id}` : "/dashboard/leaderboard"}
              className="sig-row" onClick={() => setOpen(false)}>
              <span className={`sig-kind sig-${r.kind}`} />
              <span className="sig-text">{line(r)}</span>
              <span className="sig-ago">{ago(r.created_at)}</span>
            </Link>
          ))}
        </div>
      )}

      {toast && (
        <div className="sig-toast">
          <span className={`sig-kind sig-${toast.kind}`} />
          <span className="sig-text">{line(toast)}</span>
        </div>
      )}
    </div>
  );
}

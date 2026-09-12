"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LogRow {
  id: string; action: string; target_table: string; target_id: string;
  diff: Record<string, unknown>; created_at: string; message: string | null;
  profiles: { full_name: string } | null;
}
interface SeenRow {
  id: string; resource: string; created_at: string;
  viewer: { full_name: string } | null;
  viewed: { full_name: string } | null;
}

export default function TraceScreen() {
  const [mut, setMut] = useState<LogRow[]>([]);
  const [seen, setSeen] = useState<SeenRow[]>([]);
  const [tab, setTab] = useState<"MUT" | "SEE">("MUT");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("audit_log")
      .select("*, profiles!audit_log_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => setMut((data as unknown as LogRow[]) ?? []));
    supabase.from("access_log")
      .select("*, viewer:profiles!access_log_viewer_id_fkey(full_name), viewed:profiles!access_log_viewed_member_id_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => setSeen((data as unknown as SeenRow[]) ?? []));
  }, []);

  function exportCsv() {
    const head = "action,table,message,actor,timestamp\n";
    const body = mut.map((r) =>
      [r.action, r.target_table, JSON.stringify(r.message ?? ""), r.profiles?.full_name ?? "", r.created_at].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "cipher_trace.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const ts = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={() => setTab("MUT")} className="lbl"
            style={{ background: "none", border: "none", cursor: "pointer", color: tab === "MUT" ? "var(--hot)" : "var(--faint)" }}>
            MUTATIONS · {mut.length}
          </button>
          <button onClick={() => setTab("SEE")} className="lbl"
            style={{ background: "none", border: "none", cursor: "pointer", color: tab === "SEE" ? "var(--hot)" : "var(--faint)" }}>
            SIGHTINGS · {seen.length}
          </button>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="lbl-faint" style={{ fontSize: 9 }}>APPEND-ONLY</span>
          <button className="btn" onClick={exportCsv}>EXPORT CSV</button>
        </div>
      </div>

      {tab === "MUT" ? (
        mut.length === 0
          ? <Empty line="NO MUTATIONS" sub="EVERY WRITE TO THE LEDGER LANDS HERE, UNPROMPTED" />
          : (
            <div className="panel">
              {mut.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <button onClick={() => setOpen(open === r.id ? null : r.id)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "11px 15px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                      <span className="lbl val" style={{ fontSize: 9, minWidth: 52, color: r.action === "insert" ? "var(--bone)" : r.action === "delete" ? "var(--dimmer)" : "var(--hot)" }}>
                        {r.action.toUpperCase()}
                      </span>
                      <span className="lbl-faint" style={{ fontSize: 9, minWidth: 58 }}>{r.target_table}</span>
                      <span style={{ fontSize: 12, color: "var(--bone)", letterSpacing: ".02em" }}>
                        {r.message ?? `#${r.target_id?.slice(0, 8)} · ${r.profiles?.full_name?.toUpperCase() ?? "SYSTEM"}`}
                      </span>
                    </span>
                    <span className="lbl-faint val" style={{ fontSize: 9 }}>{ts(r.created_at)}</span>
                  </button>
                  {open === r.id && (
                    <pre style={{ padding: "0 15px 14px", fontSize: 10, color: "var(--dim)", overflowX: "auto", lineHeight: 1.6 }}>
                      {JSON.stringify(r.diff, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )
      ) : (
        seen.length === 0
          ? <Empty line="NO SIGHTINGS" sub="OPENING ANOTHER NODE'S FILE IS RECORDED HERE" />
          : (
            <div className="panel">
              {seen.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "11px 15px", borderBottom: "1px solid var(--line-2)", fontSize: 11 }}>
                  <span style={{ color: "var(--dim)" }}>
                    <span style={{ color: "var(--hot)" }}>{a.viewer?.full_name?.toUpperCase() ?? "UNKNOWN"}</span>
                    {" READ "}
                    <span style={{ color: "var(--bone)" }}>{a.viewed?.full_name?.toUpperCase() ?? "UNKNOWN"}</span>
                  </span>
                  <span className="lbl-faint val" style={{ fontSize: 9 }}>{ts(a.created_at)}</span>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}

function Empty({ line, sub }: { line: string; sub: string }) {
  return (
    <div className="panel" style={{ padding: 24 }}>
      <div className="lbl-faint" style={{ marginBottom: 6 }}>{line}</div>
      <div style={{ fontSize: 11, color: "var(--dimmer)" }}>{sub}<span className="caret">_</span></div>
    </div>
  );
}

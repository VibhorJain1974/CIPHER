"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Row {
  id: number; channel: "email" | "whatsapp"; kind: "queued" | "cleared" | "voided";
  to_email: string | null; to_phone: string | null;
  subject: string | null; body: string; full_name: string | null;
  created_at: string; sent_at: string | null; error: string | null;
}

/**
 * Every notification the board wants to send, written down before anything is
 * delivered. An outbox rather than a fire-and-forget send: a message that fails
 * is visible and can be sent by hand, and nothing is lost when a provider is
 * not wired up yet.
 */
export default function Outbox() {
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(() => {
    createClient().from("outbox_view").select("*")
      .is("sent_at", null).order("created_at", { ascending: false }).limit(40)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function markSent(id: number) {
    await createClient().from("outbox").update({ sent_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function copy(r: Row) {
    const text = [r.subject, r.body].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(r.id); setTimeout(() => setCopied(null), 1800); }
    catch { /* clipboard refused: the text is on screen anyway */ }
  }

  return (
    <div className="panel">
      <div style={{ padding: "12px 15px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">OUTBOX // {rows.length} WAITING</span>
        <span className="lbl-faint" style={{ fontSize: 8 }}>FILED, CLEARED AND VOIDED ALERTS</span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "18px 15px" }}>
          <div className="lbl-faint" style={{ fontSize: 9, lineHeight: 1.9 }}>
            NOTHING WAITING. A MESSAGE LANDS HERE THE MOMENT AN ENTRY IS FILED,
            CLEARED OR VOIDED.<span className="caret">_</span>
          </div>
        </div>
      ) : rows.map((r) => (
        <div key={r.id} style={{ padding: "12px 15px", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ display: "flex", gap: 9, alignItems: "baseline", flexWrap: "wrap", marginBottom: 6 }}>
            <span className="lbl val" style={{ fontSize: 8, color: r.channel === "whatsapp" ? "#3ddc84" : "var(--hot)" }}>
              {r.channel.toUpperCase()}
            </span>
            <span className="lbl-faint" style={{ fontSize: 8 }}>
              {r.kind.toUpperCase()} · {r.to_email ?? r.to_phone}
            </span>
          </div>
          {r.subject && <div style={{ fontSize: 11.5, color: "var(--bone)", marginBottom: 4 }}>{r.subject}</div>}
          <div style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.7 }}>{r.body}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <button className="btn" onClick={() => copy(r)}>{copied === r.id ? "COPIED" : "COPY"}</button>
            <button className="btn" onClick={() => markSent(r.id)}>MARK SENT</button>
          </div>
        </div>
      ))}
    </div>
  );
}

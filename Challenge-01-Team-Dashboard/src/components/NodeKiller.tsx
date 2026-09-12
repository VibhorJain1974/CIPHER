"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { divisionOf, type Profile } from "@/lib/types";
import AgentSigil from "./AgentSigil";

/**
 * The kill switch. Core can remove any node from here, and removal is total:
 * the account, their entries, their proof, their marks and their messages all
 * go, in one cascade, from every table at once.
 *
 * Two steps on purpose, and the leads cannot be killed at all. That rule lives
 * in the database, not in this component, so it holds even if someone calls
 * the function directly.
 */
export default function NodeKiller({ selfId }: { selfId: string }) {
  const [rows, setRows] = useState<Profile[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const load = () => {
    createClient().from("profiles").select("*").order("full_name")
      .then(({ data }) => setRows((data as Profile[]) ?? []));
  };
  useEffect(load, []);

  async function toggleHidden(p: Profile) {
    setBusy(p.id); setErr(""); setNote("");
    const { error } = await createClient().rpc("set_hidden", { p_id: p.id, p_hidden: !p.hidden });
    setBusy(null);
    if (error) { setErr(error.message.toUpperCase()); return; }
    setNote(p.hidden
      ? `${p.full_name.toUpperCase()} IS LIVE. THE CREW SEES IT AGAIN.`
      : `${p.full_name.toUpperCase()} IS HIDDEN. ITS POINTS, MARKS AND SIGNALS LEAVE THE BOARD.`);
    load();
  }

  async function kill(p: Profile) {
    setBusy(p.id); setErr(""); setNote("");
    const { error } = await createClient().rpc("remove_member", { p_id: p.id });
    setBusy(null); setArmed(null);
    if (error) {
      const m = error.message;
      setErr(
        m.includes("lead_is_locked") ? "THAT NODE IS A LOCKED LEAD AND CANNOT BE REMOVED."
        : m.includes("cannot_remove_yourself") ? "YOU CANNOT REMOVE YOURSELF."
        : m.includes("core_clearance_required") ? "CORE CLEARANCE REQUIRED."
        : m.toUpperCase());
      return;
    }
    setNote(`${p.full_name.toUpperCase()} REMOVED FROM THE BOARD.`);
    load();
  }

  return (
    <div className="panel">
      <div style={{ padding: "12px 15px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">NODES // REMOVAL</span>
        <span className="lbl-faint" style={{ fontSize: 8 }}>DISABLE HIDES A NODE FROM THE CREW · KILL IS PERMANENT</span>
      </div>

      {err && <div style={{ padding: "10px 15px", borderBottom: "1px solid var(--line-2)" }}>
        <span className="lbl" style={{ color: "var(--hot)" }}>{err}</span></div>}
      {note && <div style={{ padding: "10px 15px", borderBottom: "1px solid var(--line-2)" }}>
        <span className="lbl" style={{ color: "var(--bone)" }}>{note}</span></div>}

      {rows.map((p) => {
        const div = divisionOf(p.department);
        const me = p.id === selfId;
        const protectedNode = p.locked || me;
        return (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 15px",
            borderBottom: "1px solid var(--line-2)", flexWrap: "wrap",
          }}>
            <AgentSigil id={p.id} name={p.full_name} col={div.col} size={34} live={!p.hidden} />
            <div style={{ flex: 1, minWidth: 150 }}>
              <Link href={`/dashboard/profile/${p.id}`} style={{ color: "var(--bone)", fontSize: 12, letterSpacing: ".05em" }}>
                {p.full_name.toUpperCase()}
              </Link>
              <div className="lbl-faint" style={{ fontSize: 8, marginTop: 3 }}>
                <span style={{ color: div.col }}>{div.code}</span> · {p.role.toUpperCase()}
                {p.locked && <span style={{ color: "var(--hot)" }}> · LOCKED LEAD</span>}
                {p.hidden && <span> · HIDDEN</span>}
              </div>
            </div>

            {!me && (
              <button className="btn" disabled={busy === p.id} onClick={() => toggleHidden(p)}
                style={p.hidden ? { borderColor: "var(--hot)", color: "var(--hot)" } : undefined}>
                {p.hidden ? "ENABLE" : "DISABLE"}
              </button>
            )}

            {protectedNode ? (
              <span className="lbl-faint" style={{ fontSize: 8 }}>{me ? "THIS IS YOU" : "PROTECTED"}</span>
            ) : armed === p.id ? (
              <div style={{ display: "flex", gap: 7 }}>
                <button className="btn btn-hot" disabled={busy === p.id} onClick={() => kill(p)}>
                  {busy === p.id ? "REMOVING…" : "CONFIRM KILL"}
                </button>
                <button className="btn" onClick={() => setArmed(null)}>CANCEL</button>
              </div>
            ) : (
              <button className="btn" onClick={() => { setArmed(p.id); setErr(""); setNote(""); }}
                style={{ borderColor: "var(--ember)", color: "var(--ember)" }}>
                KILL
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

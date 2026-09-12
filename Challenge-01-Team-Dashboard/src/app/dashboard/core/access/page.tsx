"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MemberRole, Profile, RivalTeam } from "@/lib/types";
import CodeMinter from "@/components/CodeMinter";

const ROLES: { key: MemberRole; label: string; col: string }[] = [
  { key: "member", label: "MBR",  col: "var(--dimmer)" },
  { key: "judge",  label: "JDG",  col: "var(--bone)" },
  { key: "core",   label: "CORE", col: "var(--hot)" },
];

export default function KeysScreen() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [rivals, setRivals] = useState<RivalTeam[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("rival_teams").select("*").order("name"),
    ]);
    setRows((p as Profile[]) ?? []);
    setRivals((r as RivalTeam[]) ?? []);
    setDraft(Object.fromEntries(((r as RivalTeam[]) ?? []).map((x) => [x.name, String(x.points)])));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setRole(id: string, role: MemberRole) {
    setBusy(id);
    await createClient().from("profiles").update({ role }).eq("id", id);
    await load();
    setBusy(null);
  }

  async function saveRivals() {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    await Promise.all(rivals.map((r) =>
      supabase.from("rival_teams").update({
        points: parseInt(draft[r.name] ?? "0", 10) || 0,
        updated_at: new Date().toISOString(),
        updated_by: u.user?.id,
      }).eq("name", r.name)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
    load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <CodeMinter />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">KEYS // CLEARANCE</span>
          <span className="lbl-faint">EVERY CHANGE APPENDS TO TRCE</span>
        </div>
        <div className="panel">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 90px 210px", gap: 12, padding: "9px 15px", borderBottom: "1px solid var(--line)" }}>
            {["NODE", "DEPT", "KEY", "SET"].map((h) => <span key={h} className="lbl-faint" style={{ fontSize: 9 }}>{h}</span>)}
          </div>
          {rows.length === 0 && <div style={{ padding: 18 }} className="lbl-faint">NO NODES ENROLLED</div>}
          {rows.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 90px 210px", gap: 12, alignItems: "center", padding: "11px 15px", borderBottom: "1px solid var(--line-2)" }}>
              <span style={{ fontSize: 12, letterSpacing: ".05em", color: "var(--bone)" }}>{p.full_name.toUpperCase()}</span>
              <span className="lbl-faint" style={{ fontSize: 9 }}>{(p.department || "—").toUpperCase()}</span>
              <span className="code" style={{ color: ROLES.find((r) => r.key === p.role)?.col }}>
                {ROLES.find((r) => r.key === p.role)?.label}
              </span>
              {p.locked ? (
                <span className="lbl" style={{ fontSize: 9, color: "var(--hot)", border: "1px solid var(--hot)", padding: "4px 9px", justifySelf: "start" }}>
                  LOCKED · TEAM LEAD
                </span>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  {ROLES.map((r) => (
                    <button key={r.key} disabled={busy === p.id || p.role === r.key} onClick={() => setRole(p.id, r.key)}
                      className="lbl"
                      style={{
                        background: "none", cursor: p.role === r.key ? "default" : "pointer",
                        border: `1px solid ${p.role === r.key ? r.col : "var(--line)"}`,
                        color: p.role === r.key ? r.col : "var(--faint)",
                        padding: "4px 9px", fontSize: 9, opacity: busy === p.id ? .4 : 1,
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lbl-faint" style={{ marginTop: 8, fontSize: 9, lineHeight: 1.7 }}>
          JDG SEES EVERY SUBMISSION AND PROOF, READ ONLY · CORE ALSO DECRYPTS, AWARDS AND READS TRCE\n          · LOCKED LEADS CANNOT BE DEMOTED, INCLUDING BY THEMSELVES
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">THEATRE // RIVAL TOTALS</span>
          <span className="lbl-faint">AARVAK ANNOUNCES THESE · WE CANNOT READ THEM, SO TYPE THEM</span>
        </div>
        <div className="panel" style={{ padding: 15 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
            {rivals.map((r) => (
              <label key={r.name}>
                <div className="lbl" style={{ marginBottom: 6, fontSize: 9 }}>{r.name}</div>
                <input className="fld val" type="number" value={draft[r.name] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.name]: e.target.value }))} />
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
            <button className="btn btn-hot" onClick={saveRivals}>COMMIT STANDINGS</button>
            {saved && <span className="lbl" style={{ color: "var(--bone)" }}>COMMITTED</span>}
            {rivals[0] && <span className="lbl-faint" style={{ fontSize: 9 }}>
              LAST SET {new Date(rivals[0].updated_at).toLocaleDateString("en-GB")}
            </span>}
          </div>
        </div>
      </div>
    </div>
  );
}

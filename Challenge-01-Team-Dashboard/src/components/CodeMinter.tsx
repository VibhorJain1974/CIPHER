"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/lib/types";

interface Code {
  code: string;
  expires_at: string | null;
  role: MemberRole;
  issued_to: string | null;
  single_use: boolean;
  active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const ROLE_COL: Record<string, string> = {
  member: "var(--dim)", judge: "var(--bone)", core: "var(--hot)",
};

/** One code per person. Spent on first use, revocable until then. */
export default function CodeMinter() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [who, setWho] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [hours, setHours] = useState("168");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("invite_codes").select("*").order("created_at", { ascending: false });
    setCodes((data as Code[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function mint() {
    setErr("");
    if (!who.trim()) { setErr("NAME REQUIRED"); return; }
    setBusy(true);
    const { error } = await createClient().rpc("mint_invite", {
      p_name: who.trim(), p_role: role, p_hours: parseInt(hours, 10),
    });
    setBusy(false);
    if (error) { setErr(error.message.toUpperCase()); return; }
    setWho("");
    load();
  }

  async function revoke(code: string) {
    await createClient().rpc("revoke_invite", { p_code: code });
    load();
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* clipboard blocked, they can select it by hand */ }
  }

  const live = codes.filter((c) => c.active && !c.used_by && (!c.expires_at || new Date(c.expires_at) > new Date()));
  const spent = codes.filter((c) => !(c.active && !c.used_by && (!c.expires_at || new Date(c.expires_at) > new Date())));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">CODES // ONE PER PERSON</span>
        <span className="lbl-faint">SINGLE USE · DIES ON ENROLMENT · CORE ONLY</span>
      </div>

      <div className="panel" style={{ padding: 15, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 180 }}>
            <div className="lbl" style={{ marginBottom: 6, fontSize: 9 }}>ISSUE TO</div>
            <input className="fld" value={who} onChange={(e) => setWho(e.target.value)}
              placeholder="KARTIK SHARMA" onKeyDown={(e) => e.key === "Enter" && mint()} />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6, fontSize: 9 }}>CLEARANCE</div>
            <select className="fld" style={{ width: 120 }} value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}>
              <option value="member">MEMBER</option>
              <option value="judge">JUDGE</option>
              <option value="core">CORE</option>
            </select>
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6, fontSize: 9 }}>VALID FOR</div>
            <select className="fld" style={{ width: 118 }} value={hours}
              onChange={(e) => setHours(e.target.value)}>
              <option value="24">24 HOURS</option>
              <option value="72">3 DAYS</option>
              <option value="168">7 DAYS</option>
              <option value="720">30 DAYS</option>
              <option value="0">NO EXPIRY</option>
            </select>
          </label>
          <button className="btn btn-hot" disabled={busy} onClick={mint} style={{ height: 34 }}>
            {busy ? "MINTING…" : "MINT CODE"}
          </button>
          {err && <span className="lbl" style={{ color: "var(--hot)" }}>{err}</span>}
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 80px 200px", gap: 12, padding: "9px 15px", borderBottom: "1px solid var(--line)" }}>
          {["CODE", "ISSUED TO", "KEY", "STATE"].map((h) => (
            <span key={h} className="lbl-faint" style={{ fontSize: 9 }}>{h}</span>
          ))}
        </div>

        {codes.length === 0 && (
          <div style={{ padding: 18 }} className="lbl-faint">NONE MINTED<span className="caret">_</span></div>
        )}

        {[...live, ...spent].map((c) => {
          const expired = !!c.expires_at && new Date(c.expires_at) < new Date();
          const dead = !!c.used_by || !c.active || expired;
          const leftMs = c.expires_at ? new Date(c.expires_at).getTime() - Date.now() : null;
          const leftTxt = leftMs === null ? "NO EXPIRY"
            : leftMs <= 0 ? "EXPIRED"
            : leftMs < 36e5 ? `${Math.ceil(leftMs / 6e4)}M LEFT`
            : leftMs < 864e5 ? `${Math.ceil(leftMs / 36e5)}H LEFT`
            : `${Math.ceil(leftMs / 864e5)}D LEFT`;
          return (
            <div key={c.code} style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 80px 200px",
              gap: 12, alignItems: "center", padding: "11px 15px",
              borderBottom: "1px solid var(--line-2)", opacity: dead ? .45 : 1,
            }}>
              <button onClick={() => copy(c.code)} disabled={dead}
                className="val"
                style={{
                  background: "none", border: "none", padding: 0, textAlign: "left",
                  cursor: dead ? "default" : "pointer",
                  fontSize: 14, letterSpacing: ".12em",
                  color: dead ? "var(--dimmer)" : "var(--bone)",
                  textDecoration: dead ? "line-through" : "none",
                }}>
                {c.code}
                {copied === c.code && <span className="lbl" style={{ color: "var(--hot)", marginLeft: 10, fontSize: 9 }}>COPIED</span>}
              </button>
              <span className="lbl-faint" style={{ fontSize: 9 }}>{(c.issued_to ?? "—").toUpperCase()}</span>
              <span className="lbl val" style={{ fontSize: 9, color: ROLE_COL[c.role] }}>
                {c.role === "member" ? "MBR" : c.role === "judge" ? "JDG" : "CORE"}
              </span>
              {c.used_by ? (
                <span className="lbl-faint" style={{ fontSize: 9 }}>
                  SPENT {c.used_at ? new Date(c.used_at).toLocaleDateString("en-GB") : ""}
                </span>
              ) : !c.active ? (
                <span className="lbl-faint" style={{ fontSize: 9 }}>REVOKED</span>
              ) : expired ? (
                <span className="lbl" style={{ fontSize: 9, color: "var(--dimmer)" }}>EXPIRED</span>
              ) : (
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="lbl val" style={{ fontSize: 9, color: leftMs !== null && leftMs < 864e5 ? "var(--hot)" : "var(--dim)" }}>
                    {leftTxt}
                  </span>
                  <button className="lbl" onClick={() => revoke(c.code)}
                    style={{ background: "none", border: "1px solid var(--line)", color: "var(--faint)", padding: "3px 9px", fontSize: 9, cursor: "pointer" }}>
                    REVOKE
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="lbl-faint" style={{ marginTop: 8, fontSize: 9, lineHeight: 1.8 }}>
        CLICK A CODE TO COPY · SEND IT TO THAT PERSON ONLY · IT DIES ON ENROLMENT OR WHEN IT EXPIRES, WHICHEVER COMES FIRST
      </div>
    </div>
  );
}

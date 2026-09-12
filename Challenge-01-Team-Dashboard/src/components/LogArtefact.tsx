"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sha256File } from "@/lib/hash";
import { divisionOf, sizeFor, type PointRule, type Profile } from "@/lib/types";

/** Where the team parks its work. Shown as the default so nobody has to
 *  remember it, and so the organisers always land on the right folder. */
export const TEAM_REPO = "https://github.com/VibhorJain1974/CIPHER";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

const SCOPE_LABEL: Record<string, string> = {
  team: "TEAM ACTIVITY",
  individual: "INDIVIDUAL CONTRIBUTION",
  track: "SPRINT TRACK",
};

export default function LogArtefact({ userId, onFiled }: { userId: string; onFiled?: () => void }) {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [ruleCode, setRuleCode] = useState("");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repo, setRepo] = useState("");
  const [crew, setCrew] = useState<Profile[]>([]);
  const [mates, setMates] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    createClient()
      .from("point_rules").select("*").order("sort_order")
      .then(({ data }) => setRules((data as PointRule[]) ?? []));
    createClient()
      .from("profiles").select("*").order("full_name")
      .then(({ data }) => setCrew(((data as Profile[]) ?? []).filter((p) => p.id !== userId)));
  }, [userId]);

  const rule = useMemo(() => rules.find((r) => r.code === ruleCode) ?? null, [rules, ruleCode]);

  const grouped = useMemo(() => {
    const g: Record<string, PointRule[]> = {};
    rules.forEach((r) => { (g[r.scope] ??= []).push(r); });
    return g;
  }, [rules]);

  async function pickFile(f: File | null) {
    setErr("");
    setFile(null); setHash("");
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { setErr("ARTEFACT REJECTED // IMAGE OR PDF ONLY"); return; }
    if (f.size > MAX_SIZE) { setErr("ARTEFACT REJECTED // EXCEEDS 10MB"); return; }
    setFile(f);
    setHash(await sha256File(f));
  }

  async function file_() {
    setErr("");
    if (!rule) { setErr("SELECT A CODEX ENTRY"); return; }
    if (!title.trim()) { setErr("TITLE REQUIRED"); return; }
    if (rule.needs_venue && !venue.trim()) { setErr("VENUE REQUIRED FOR " + rule.category); return; }
    if (!file) { setErr("NO PROOF ATTACHED // NO PROOF, NO POINTS"); return; }

    setBusy(true);
    const supabase = createClient();
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("achievements").insert({
        member_id: userId,
        rule_code: rule.code,
        category: rule.category,
        title: title.trim(),
        description: desc.trim(),
        venue: rule.needs_venue ? venue.trim() : null,
        achievement_date: date,
        proof_path: path,
        proof_filename: file.name,
        proof_hash: hash,
        repo_url: repo.trim() || null,
        contributors: mates,
      });
      if (insErr) throw insErr;

      setTitle(""); setDesc(""); setVenue(""); setFile(null); setHash(""); setRuleCode("");
      setRepo(""); setMates([]);
      setOk(true); onFiled?.();
      setTimeout(() => setOk(false), 3200);
    } catch (e) {
      setErr((e instanceof Error ? e.message : "TRANSMISSION FAILED").toUpperCase());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <span className="lbl-hot">NODE // FILE ARTEFACT</span>
        <span className="lbl-faint">UNVERIFIED UNTIL DECRYPTED BY CORE</span>
      </div>

      {/* codex picker: the weight is the point, so it is set in type */}
      <div style={{ marginBottom: 16 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>CODEX ENTRY</div>
        {(["team", "individual", "track"] as const).map((scope) => (
          <div key={scope} style={{ marginBottom: 10 }}>
            <div className="lbl-faint" style={{ marginBottom: 4, fontSize: 9 }}>{SCOPE_LABEL[scope]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: "1px 1px", background: "var(--line-2)", border: "1px solid var(--line-2)" }}>
              {(grouped[scope] ?? []).map((r) => {
                const on = r.code === ruleCode;
                return (
                  <button
                    key={r.code}
                    onClick={() => { setRuleCode(r.code); if (!r.needs_venue) setVenue(""); }}
                    title={r.label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                      height: 30, background: on ? "var(--void-hot)" : "var(--void)",
                      border: "none", borderLeft: `2px solid ${on ? "var(--hot)" : "transparent"}`,
                      padding: "0 9px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{
                      fontSize: 10, letterSpacing: ".04em", whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                      color: on ? "var(--bone)" : "var(--dim)",
                    }}>
                      {r.short_label ?? r.label}
                    </span>
                    <span className="val" style={{
                      flexShrink: 0,
                      fontSize: r.points >= 100 ? 15 : r.points >= 50 ? 13 : 11,
                      fontWeight: r.points >= 50 ? 600 : 400,
                      color: r.points >= 50 ? "var(--hot)" : on ? "var(--bone)" : "var(--dimmer)",
                    }}>{r.points}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label>
          <div className="lbl" style={{ marginBottom: 6 }}>TITLE</div>
          <input className="fld" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={rule ? rule.label : "SELECT A CODEX ENTRY FIRST"} />
        </label>
        <label>
          <div className="lbl" style={{ marginBottom: 6 }}>DATE IT HAPPENED</div>
          <input className="fld val" type="date" value={date} max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      {/* venue only exists for things that happen somewhere */}
      {rule?.needs_venue && (
        <label style={{ display: "block", marginBottom: 12 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>
            VENUE <span style={{ color: "var(--hot)" }}>· REQUIRED FOR {rule.category}</span>
          </div>
          <input className="fld" value={venue} onChange={(e) => setVenue(e.target.value)}
            placeholder="WHERE IT TOOK PLACE" />
        </label>
      )}

      <label style={{ display: "block", marginBottom: 12 }}>
        <div className="lbl" style={{ marginBottom: 6 }}>DETAIL <span style={{ color: "var(--faint)" }}>· OPTIONAL</span></div>
        <textarea className="fld" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="LINKS, REPO, PLACEMENT, ANYTHING A VERIFIER WOULD WANT" />
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div className="lbl" style={{ marginBottom: 6 }}>
          SOURCE <span style={{ color: "var(--faint)" }}>· REPO OR FOLDER LINK · OPTIONAL</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="fld" style={{ flex: 1, minWidth: 200 }} value={repo}
            onChange={(e) => setRepo(e.target.value)} placeholder={TEAM_REPO + "/tree/main/…"} />
          <button type="button" className="btn" onClick={() => setRepo(TEAM_REPO)}>TEAM REPO</button>
        </div>
      </label>

      {/* Credit. The organisers need to know who actually built the thing,
          not just who happened to file it. Everyone named here shows on the
          CREDITS ledger once the entry clears. */}
      <div style={{ marginBottom: 12 }}>
        <div className="lbl" style={{ marginBottom: 6 }}>
          WORKED ON THIS WITH ME <span style={{ color: "var(--faint)" }}>· OPTIONAL</span>
        </div>
        {crew.length === 0 ? (
          <div className="lbl-faint" style={{ fontSize: 9 }}>NO OTHER NODES ENROLLED YET</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {crew.map((c) => {
              const on = mates.includes(c.id);
              const dv = divisionOf(c.department);
              return (
                <button key={c.id} type="button"
                  onClick={() => setMates((m) => on ? m.filter((x) => x !== c.id) : [...m, c.id])}
                  style={{
                    border: `1px solid ${on ? dv.col : "var(--line)"}`,
                    background: on ? "var(--void-hot)" : "transparent",
                    color: on ? "var(--bone)" : "var(--dim)",
                    fontSize: 10, letterSpacing: ".1em", padding: "5px 10px", cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                  {on ? "✓ " : ""}{c.full_name.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="lbl" style={{ marginBottom: 6 }}>PROOF <span style={{ color: "var(--faint)" }}>· IMAGE OR PDF · 10MB</span></div>
        <div style={{ border: "1px dashed var(--line)", padding: 13, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <input type="file" accept={ACCEPTED.join(",")} onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 11, color: "var(--dim)", maxWidth: "100%" }} />
          {file
            ? <span className="lbl val" style={{ color: "var(--bone)" }}>
                {Math.ceil(file.size / 1024)}KB · SEALED {hash.slice(0, 12)}…
              </span>
            : <span className="lbl-faint">NO ARTEFACT</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button className="btn btn-hot" disabled={busy || !rule} onClick={file_}>
          {busy ? "TRANSMITTING…" : "ENCODE"}
        </button>
        {rule && (
          <span className="lbl">
            CLAIMS <span className="val" style={{ color: "var(--hot)", fontSize: sizeFor(rule.points) }}>{rule.points}</span> ON DECRYPT
          </span>
        )}
        {err && <span className="lbl" style={{ color: "var(--hot)" }}>{err}</span>}
        {ok && <span className="lbl" style={{ color: "var(--bone)" }}>FILED · AWAITING DECRYPT</span>}
      </div>
    </div>
  );
}

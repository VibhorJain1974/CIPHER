"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sizeFor, type QueueRow } from "@/lib/types";
import { seq } from "@/lib/glyphs";

interface Row extends QueueRow { dupOf?: string }

export default function QueueScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [award, setAward] = useState<Record<string, string>>({});
  const [cause, setCause] = useState<Record<string, string>>({});
  const [arming, setArming] = useState<Record<string, boolean>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [slam, setSlam] = useState<{ pts: number; who: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("queue_view").select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const list = (data as Row[]) ?? [];

    // a proof file reused across submissions is the cheapest fraud to catch
    const hashes = list.map((r) => r.proof_hash).filter(Boolean) as string[];
    if (hashes.length) {
      const { data: all } = await supabase
        .from("achievements").select("id, proof_hash, title").in("proof_hash", hashes);
      const seen: Record<string, number> = {};
      (all ?? []).forEach((a: { proof_hash: string }) => {
        seen[a.proof_hash] = (seen[a.proof_hash] ?? 0) + 1;
      });
      list.forEach((r) => { if (r.proof_hash && seen[r.proof_hash] > 1) r.dupOf = "REUSED"; });
    }

    setAward(Object.fromEntries(list.map((r) => [r.id, String(r.rule_points ?? "")])));
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openProof(r: Row) {
    if (!r.proof_path) return;
    const { data } = await createClient().storage.from("proofs").createSignedUrl(r.proof_path, 120);
    if (data?.signedUrl) setUrls((s) => ({ ...s, [r.id]: data.signedUrl }));
  }

  async function decrypt(r: Row) {
    const pts = parseInt(award[r.id] ?? "", 10);
    if (!Number.isFinite(pts) || pts <= 0) return;
    setBusy(r.id);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("achievements").update({
      status: "verified", points: pts,
      verified_by: u.user?.id, verified_at: new Date().toISOString(),
    }).eq("id", r.id);
    setBusy(null);
    setSlam({ pts, who: r.full_name });
    setTimeout(() => setSlam(null), 1200);
    load();
  }

  async function voidIt(r: Row) {
    if (!arming[r.id]) { setArming((a) => ({ ...a, [r.id]: true })); return; }
    setBusy(r.id);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("achievements").update({
      status: "rejected",
      rejection_reason: cause[r.id]?.trim() || "NO VALID PROOF",
      verified_by: u.user?.id, verified_at: new Date().toISOString(),
    }).eq("id", r.id);
    setBusy(null);
    load();
  }

  if (loading) return <div className="lbl-faint">READING QUEUE…</div>;

  const latent = rows.reduce((s, r) => s + (r.rule_points ?? 0), 0);

  return (
    <div style={{ position: "relative" }}>
      {slam && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div className="slam val" style={{ fontSize: 200, fontWeight: 700, color: "var(--hot)", lineHeight: 1 }}>
            +{slam.pts}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="lbl-hot" style={{ marginBottom: 5 }}>QUEU // AWAITING DECRYPT</div>
          <div className="val" style={{ fontSize: 44, lineHeight: 1, color: rows.length ? "var(--bone)" : "var(--dimmer)" }}>
            {String(rows.length).padStart(2, "0")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="lbl-faint" style={{ marginBottom: 5 }}>LATENT · UNRELEASED POINTS</div>
          <div className={`val ${latent ? "flick" : ""}`} style={{ fontSize: 30, color: latent ? "var(--hot)" : "var(--dimmer)" }}>
            {latent}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 26 }}>
          <div className="lbl-faint" style={{ marginBottom: 6 }}>QUEUE CLEAR</div>
          <div style={{ fontSize: 11, color: "var(--dimmer)" }}>NOTHING HELD · NOTHING OWED<span className="caret">_</span></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => {
            const aged = Math.floor((Date.now() - Date.parse(r.created_at)) / 864e5);
            const heavy = (r.rule_points ?? 0) >= 100;
            return (
              <div key={r.id} className={`panel ${heavy ? "boss" : ""}`} style={{ padding: 16, background: heavy ? "var(--void-hot)" : "var(--panel-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, letterSpacing: ".05em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
                    <div className="lbl-faint" style={{ fontSize: 9, marginTop: 4 }}>
                      {r.full_name.toUpperCase()} · {(r.department || "—").toUpperCase()} · SEQ {seq(r.seq)}
                    </div>
                    <div className="lbl-faint" style={{ fontSize: 9, marginTop: 3 }}>
                      HAPPENED {r.achievement_date}
                      {r.venue ? " · " + r.venue.toUpperCase() : " · NO VENUE"}
                      {" · FILED " + new Date(r.created_at).toLocaleDateString("en-GB")}
                      {aged >= 3 && <span style={{ color: "var(--hot)" }}> · HELD {aged}D</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {r.dupOf && <span className="code" style={{ color: "var(--hot)" }}>PROOF REUSED</span>}
                    <span className="val" style={{ fontSize: sizeFor(r.rule_points), lineHeight: 1, color: "var(--hot)" }}>
                      {r.rule_points ?? "??"}
                    </span>
                  </div>
                </div>

                {r.description && (
                  <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 10, letterSpacing: ".03em" }}>{r.description}</div>
                )}

                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 13, flexWrap: "wrap" }}>
                  {r.proof_path ? (
                    urls[r.id]
                      ? <a href={urls[r.id]} target="_blank" rel="noreferrer" className="lbl" style={{ color: "var(--hot)" }}>OPEN {r.proof_filename?.toUpperCase()}</a>
                      : <button className="btn" onClick={() => openProof(r)}>INSPECT PROOF</button>
                  ) : <span className="lbl" style={{ color: "var(--hot)" }}>NO PROOF · NO POINTS</span>}
                  {r.proof_hash && <span className="lbl-faint val" style={{ fontSize: 9 }}>SHA256 {r.proof_hash.slice(0, 16)}…</span>}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input className="fld val" style={{ width: 84 }} type="number" value={award[r.id] ?? ""}
                    onChange={(e) => setAward((a) => ({ ...a, [r.id]: e.target.value }))} />
                  <span className="lbl-faint" style={{ fontSize: 9 }}>CODEX SAYS {r.rule_points ?? "—"}</span>
                  <button className="btn btn-hot" disabled={busy === r.id} onClick={() => decrypt(r)}>DECRYPT</button>
                  <input className="fld" style={{ flex: 1, minWidth: 170 }} placeholder="CAUSE, IF VOIDING"
                    value={cause[r.id] ?? ""} onChange={(e) => setCause((c) => ({ ...c, [r.id]: e.target.value }))} />
                  <button className="btn" disabled={busy === r.id} onClick={() => voidIt(r)}
                    style={{ borderColor: arming[r.id] ? "var(--hot)" : "var(--line)", color: arming[r.id] ? "var(--hot)" : "var(--dim)" }}>
                    {arming[r.id] ? "CONFIRM VOID" : "VOID"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

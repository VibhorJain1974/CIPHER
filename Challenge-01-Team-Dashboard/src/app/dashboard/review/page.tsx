"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sizeFor, type QueueRow, type SubmissionStatus } from "@/lib/types";
import { seq } from "@/lib/glyphs";

const FILTERS: (SubmissionStatus | "all")[] = ["all", "pending", "verified", "rejected"];
const ST: Record<string, string> = { pending: "var(--hot)", verified: "var(--bone)", rejected: "var(--dimmer)" };

export default function SeenScreen() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("queue_view").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setRows((data as QueueRow[]) ?? []); setLoading(false); });
  }, []);

  async function openProof(r: QueueRow) {
    if (!r.proof_path) return;
    const { data } = await createClient().storage.from("proofs").createSignedUrl(r.proof_path, 120);
    if (data?.signedUrl) setUrls((s) => ({ ...s, [r.id]: data.signedUrl }));
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  if (loading) return <div className="lbl-faint">READING…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">SEEN // READ-ONLY REVIEW</span>
        <span className="lbl-faint">PROOF INSPECTION ONLY · NO AWARDS FROM HERE</span>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "14px 0 16px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="lbl"
            style={{
              background: "none", cursor: "pointer", padding: "5px 11px", fontSize: 9,
              border: `1px solid ${filter === f ? "var(--hot)" : "var(--line)"}`,
              color: filter === f ? "var(--hot)" : "var(--faint)",
            }}>
            {f.toUpperCase()} · {f === "all" ? rows.length : rows.filter((r) => r.status === f).length}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="panel" style={{ padding: 24 }}>
          <div className="lbl-faint">NOTHING FILED YET</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((r) => (
            <div key={r.id} className="panel" style={{ padding: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, letterSpacing: ".05em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
                  <div className="lbl-faint" style={{ fontSize: 9, marginTop: 4 }}>
                    {r.full_name.toUpperCase()} · SEQ {seq(r.seq)} · {r.rule_label ?? r.category} · HAPPENED {r.achievement_date}
                    {r.venue ? " · " + r.venue.toUpperCase() : ""}
                    {" · FILED " + new Date(r.created_at).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span className="code" style={{ color: ST[r.status] }}>{r.status}</span>
                  <span className="val" style={{ fontSize: sizeFor(r.points ?? r.rule_points), lineHeight: 1, color: r.status === "verified" ? "var(--hot)" : "var(--faint)" }}>
                    {r.status === "verified" ? r.points : r.rule_points ?? "—"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 11, flexWrap: "wrap" }}>
                {r.proof_path ? (
                  urls[r.id]
                    ? <a href={urls[r.id]} target="_blank" rel="noreferrer" className="lbl" style={{ color: "var(--hot)" }}>OPEN {r.proof_filename?.toUpperCase()}</a>
                    : <button className="btn" onClick={() => openProof(r)}>INSPECT PROOF</button>
                ) : <span className="lbl" style={{ color: "var(--hot)" }}>NO PROOF</span>}
                {r.proof_hash && <span className="lbl-faint val" style={{ fontSize: 9 }}>SHA256 {r.proof_hash.slice(0, 16)}…</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

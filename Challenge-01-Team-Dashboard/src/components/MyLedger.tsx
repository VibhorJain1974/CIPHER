"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sizeFor, type Achievement } from "@/lib/types";

const ST: Record<string, { code: string; col: string }> = {
  pending:  { code: "[PEND]", col: "var(--hot)" },
  verified: { code: "[VRFD]", col: "var(--bone)" },
  rejected: { code: "[VOID]", col: "var(--dimmer)" },
};

export default function MyLedger({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [rows, setRows] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("achievements").select("*")
      .eq("member_id", userId)
      .order("created_at", { ascending: false });
    setRows((data as Achievement[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const held = rows.filter((r) => r.status === "pending").length;
  const banked = rows.filter((r) => r.status === "verified")
    .reduce((s, r) => s + (r.points ?? 0), 0);

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span className="lbl-hot">MY LEDGER</span>
        <span className="lbl-faint">{rows.length} FILED</span>
      </div>

      <div style={{ display: "flex", gap: 26, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line-2)" }}>
        <div>
          <div className="lbl-faint" style={{ marginBottom: 3 }}>BANKED</div>
          <div className="val" style={{ fontSize: 30, fontWeight: 600, color: banked ? "var(--hot)" : "var(--dimmer)" }}>{banked}</div>
        </div>
        <div>
          <div className="lbl-faint" style={{ marginBottom: 3 }}>IN QUEUE</div>
          <div className="val" style={{ fontSize: 30, fontWeight: 300, color: held ? "var(--bone)" : "var(--dimmer)" }}>{held}</div>
        </div>
      </div>

      {loading ? (
        <div className="lbl-faint">READING…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: "26px 0" }}>
          <div className="lbl-faint" style={{ marginBottom: 6 }}>LEDGER EMPTY</div>
          <div style={{ fontSize: 11, color: "var(--dimmer)", letterSpacing: ".04em" }}>
            NOTHING FILED. THE BOARD STARTS AT ZERO<span className="caret">_</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {rows.map((r) => {
            const st = ST[r.status];
            return (
              <div key={r.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--line-2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span className="lbl val" style={{ color: st.col, fontSize: 9, paddingTop: 3, minWidth: 44 }}>{st.code}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, letterSpacing: ".03em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
                  <div className="lbl-faint" style={{ marginTop: 3, fontSize: 9 }}>
                    {r.category} · {r.achievement_date}
                    {r.venue ? " · " + r.venue.toUpperCase() : ""}
                    {" · FILED " + new Date(r.created_at).toLocaleDateString("en-GB")}
                  </div>
                  {r.status === "rejected" && r.rejection_reason && (
                    <div style={{ fontSize: 10, color: "var(--hot)", marginTop: 4, letterSpacing: ".04em" }}>
                      CAUSE: {r.rejection_reason.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="val" style={{
                  fontSize: r.points ? sizeFor(r.points) : 12,
                  color: r.status === "verified" ? "var(--hot)" : "var(--faint)",
                  lineHeight: 1,
                }}>
                  {r.status === "verified" ? r.points : r.status === "pending" ? "??" : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

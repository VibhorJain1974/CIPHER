"use client";

import { accessLevel, barcode, divisionOf, recordId, tierOf, type MemberRole } from "@/lib/types";
import AgentSigil from "./AgentSigil";

/**
 * The dossier card. Deliberately physical: a laminated pass, not a profile
 * header. Every field on it is real — the record id and the barcode are
 * derived from the account id, so a card always redraws identically and two
 * members can never end up with the same one.
 */
export default function AgentCard({
  name, department, role, locked, id, points, rank, compact,
}: {
  name: string; department: string; role: MemberRole; locked: boolean;
  id: string; points?: number; rank?: number | null; compact?: boolean;
}) {
  const div = divisionOf(department);
  const lvl = accessLevel(role, locked);
  const rec = recordId(id);
  const bars = barcode(id, compact ? 30 : 46);
  const tier = points === undefined ? null : tierOf(points);

  return (
    <div style={{
      border: "1px solid var(--line)",
      background: "linear-gradient(135deg, var(--panel) 0%, var(--panel-2) 60%, var(--void) 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* division stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: div.col }} />
      {/* hazard corner */}
      <div style={{
        position: "absolute", right: -30, top: -30, width: 90, height: 90, transform: "rotate(45deg)",
        background: `repeating-linear-gradient(90deg, ${div.col}22 0 6px, transparent 6px 12px)`,
      }} />

      <div style={{ padding: compact ? "14px 16px 12px 18px" : "18px 20px 16px 22px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", gap: 13, minWidth: 0 }}>
            <AgentSigil id={id} name={name} col={div.col} size={compact ? 62 : 78} live={(points ?? 0) > 0 || role === "core"} />
            <div style={{ minWidth: 0 }}>
            <div className="lbl-faint" style={{ fontSize: 8, marginBottom: 5 }}>AGENT</div>
            <div style={{
              fontSize: compact ? 17 : 23, letterSpacing: ".07em", color: "var(--bone)",
              lineHeight: 1.15, wordBreak: "break-word",
            }}>{name.toUpperCase()}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
              <span style={{ color: div.col, fontSize: 12, lineHeight: 1 }}>{div.glyph}</span>
              <span className="lbl" style={{ fontSize: 9, color: div.col }}>{div.name}</span>
            </div>
            </div>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="lbl-faint" style={{ fontSize: 8, marginBottom: 5 }}>ACCESS</div>
            <div className="val" style={{
              fontSize: compact ? 24 : 30, lineHeight: 1,
              color: lvl >= 4 ? "var(--hot)" : lvl === 3 ? "var(--bone)" : "var(--dim)",
            }}>{lvl}</div>
            <div className="lbl-faint" style={{ fontSize: 8, marginTop: 4 }}>
              {role === "core" ? "COMMAND" : role === "judge" ? "OBSERVER" : "FIELD"}
            </div>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 14px",
          marginTop: compact ? 14 : 18, paddingTop: compact ? 12 : 15, borderTop: "1px solid var(--line-2)",
        }}>
          <Field k="RECORD" v={rec} />
          <Field k="UNIT" v={`CIPHER / ${div.code}`} />
          <Field k="WINDOW" v="01.09 — 15.11" />
          <Field k="STANDING" v={
            tier ? `${tier.code}${rank ? ` · ${String(rank).padStart(2, "0")}` : ""}` : "—"
          } hot={!!points} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: compact ? 22 : 28, marginTop: 14 }}>
          {bars.map((w, i) => (
            <span key={i} style={{
              width: w, height: "100%",
              background: i % 5 === 0 ? div.col : "var(--dimmer)",
              opacity: i % 3 === 0 ? 0.9 : 0.45,
            }} />
          ))}
        </div>
        <div className="lbl-faint" style={{ fontSize: 7, marginTop: 5, letterSpacing: ".3em" }}>
          {rec.replace(/[.\-]/g, " ")} · SEALED
        </div>
      </div>
    </div>
  );
}

function Field({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="lbl-faint" style={{ fontSize: 7, marginBottom: 3 }}>{k}</div>
      <div className="val" style={{
        fontSize: 10, letterSpacing: ".08em",
        color: hot ? "var(--hot)" : "var(--bone)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{v}</div>
    </div>
  );
}

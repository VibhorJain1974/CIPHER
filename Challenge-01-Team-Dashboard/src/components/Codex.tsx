"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PointRule } from "@/lib/types";

const SCOPE_LABEL: Record<string, string> = {
  team: "TEAM ACTIVITY",
  individual: "INDIVIDUAL CONTRIBUTION",
  track: "SPRINT TRACK",
};

/** The weights, ranked. The 250 sits at the top because it should.
 *  Runs full width under the filing bench, so nothing is hidden behind a
 *  scroll and a member can see the whole economy at once. */
export default function Codex() {
  const [rules, setRules] = useState<PointRule[]>([]);

  useEffect(() => {
    createClient().from("point_rules").select("*").order("points", { ascending: false })
      .then(({ data }) => setRules((data as PointRule[]) ?? []));
  }, []);

  const boss = rules.find((r) => r.code === "FNAL_WIN");
  const rest = rules.filter((r) => r.code !== "FNAL_WIN");
  const scopes = (["individual", "team", "track"] as const)
    .map((s) => [s, rest.filter((r) => r.scope === s)] as const)
    .filter(([, list]) => list.length > 0);

  return (
    <div className="panel">
      <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">CODEX // WEIGHTS</span>
        <span className="lbl-faint">EVERY WEIGHT IS FIXED · NOTHING IS AWARDED BY HAND</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(230px, .8fr) minmax(0, 3fr)", gap: 0 }}>
        {/* the boss fight */}
        {boss && (
          <div style={{ borderRight: "1px solid var(--line)", padding: 18 }}>
            <div className="boss" style={{ border: "1px solid var(--hot)", background: "var(--void-hot)", padding: 16 }}>
              <div className="lbl" style={{ color: "var(--hot)", fontSize: 9, marginBottom: 10 }}>
                TIER-Ω // SEALED UNTIL 15.11
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span className="val" style={{ fontSize: 52, lineHeight: .85, fontWeight: 600, color: "var(--hot)" }}>
                  {boss.points}
                </span>
                <span className="lbl" style={{ fontSize: 10, color: "var(--bone)", lineHeight: 1.5 }}>
                  FINAL<br />WINNER
                </span>
              </div>
              <div className="rule" style={{ margin: "14px 0 12px", background: "var(--ember)" }} />
              <div className="lbl-faint" style={{ fontSize: 9, lineHeight: 1.9 }}>
                RUNNER-UP 100 · ENTRANT 50
                <br />
                <span style={{ color: "var(--dim)" }}>SINGLE EVENT. OUTWEIGHS 50 MEETUPS.</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {scopes.map(([scope, list]) => (
            <div key={scope} style={{ padding: "18px 18px 20px", borderLeft: "1px solid var(--line-2)" }}>
              <div className="lbl-faint" style={{ fontSize: 9, marginBottom: 10 }}>{SCOPE_LABEL[scope]}</div>
              {list.map((r) => (
                <div key={r.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "5px 0" }}>
                  <span className="lbl-faint" style={{ fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.short_label ?? r.label}
                  </span>
                  <span className="val" style={{
                    fontSize: r.points >= 50 ? 20 : r.points >= 20 ? 14 : 12,
                    lineHeight: 1,
                    fontWeight: r.points >= 50 ? 600 : 400,
                    color: r.points >= 50 ? "var(--hot)" : r.points >= 20 ? "var(--bone)" : "var(--dim)",
                  }}>{r.points}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

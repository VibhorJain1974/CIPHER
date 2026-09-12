"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { divisionOf, sizeFor } from "@/lib/types";
import { TEAM_REPO } from "@/components/LogArtefact";

interface Credit {
  achievement_id: string; seq: number; title: string; category: string;
  achievement_date: string; repo_url: string | null; points: number;
  member_id: string; full_name: string; department: string; filed_it: boolean;
}

/**
 * The answer to "who actually did this". One row per person per piece of
 * cleared work, filer and collaborators alike, so the organisers can award
 * against names instead of guessing from a single submitter field.
 */
export default function CreditsScreen() {
  const [rows, setRows] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"person" | "work">("person");

  useEffect(() => {
    createClient().from("credits_view").select("*")
      .order("achievement_date", { ascending: false })
      .then(({ data }) => { setRows((data as Credit[]) ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="lbl-faint">READING CREDITS…</div>;

  const byPerson = new Map<string, Credit[]>();
  rows.forEach((r) => byPerson.set(r.member_id, [...(byPerson.get(r.member_id) ?? []), r]));

  const byWork = new Map<string, Credit[]>();
  rows.forEach((r) => byWork.set(r.achievement_id, [...(byWork.get(r.achievement_id) ?? []), r]));

  const people = [...byPerson.entries()]
    .map(([id, list]) => ({ id, list, total: list.reduce((s, r) => s + (r.points ?? 0), 0) }))
    .sort((a, b) => b.total - a.total || b.list.length - a.list.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span className="lbl-hot">CREDITS // WHO BUILT WHAT</span>
        <a href={TEAM_REPO} target="_blank" rel="noreferrer" className="lbl" style={{ color: "var(--ember)" }}>
          TEAM REPOSITORY ↗
        </a>
      </div>

      <div className="panel" style={{ padding: "13px 16px" }}>
        <div className="lbl-faint" style={{ fontSize: 9, lineHeight: 1.9 }}>
          EVERY CLEARED ENTRY LISTS THE MEMBER WHO FILED IT AND EVERYONE THEY NAMED AS
          WORKING ON IT. THIS IS THE LEDGER TO READ WHEN SPLITTING CREDIT FOR A SHARED
          DELIVERABLE.<span className="caret">_</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {(["person", "work"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={mode === m ? "btn btn-hot" : "btn"}>
            BY {m === "person" ? "MEMBER" : "DELIVERABLE"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 26 }}>
          <div className="lbl-faint" style={{ marginBottom: 7 }}>NO CREDITS YET</div>
          <div style={{ fontSize: 11, color: "var(--dimmer)", lineHeight: 1.8 }}>
            CREDIT APPEARS HERE THE MOMENT AN ENTRY CLEARS REVIEW. WHEN A MEMBER FILES,
            THEY TICK EVERYONE WHO WORKED ON IT WITH THEM.<span className="caret">_</span>
          </div>
        </div>
      ) : mode === "person" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {people.map(({ id, list, total }) => {
            const div = divisionOf(list[0].department);
            return (
              <div key={id} className="panel" style={{ borderLeft: `2px solid ${div.col}` }}>
                <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <Link href={`/dashboard/profile/${id}`} style={{ color: "var(--bone)", fontSize: 14, letterSpacing: ".06em" }}>
                    {list[0].full_name.toUpperCase()}
                  </Link>
                  <span className="lbl-faint" style={{ fontSize: 9 }}>
                    <span style={{ color: div.col }}>{div.glyph} {div.code}</span> · {list.length} PIECES ·
                    <span className="val" style={{ color: "var(--hot)" }}> {total} PTS CREDITED</span>
                  </span>
                </div>
                {list.map((r) => <Row key={r.achievement_id + id} r={r} />)}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[...byWork.values()].map((list) => {
            const h = list[0];
            return (
              <div key={h.achievement_id} className="panel">
                <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ color: "var(--bone)", fontSize: 13, letterSpacing: ".05em" }}>
                    <span className="val lbl-faint" style={{ fontSize: 9 }}>#{String(h.seq).padStart(4, "0")} </span>
                    {h.title.toUpperCase()}
                  </span>
                  <span className="val" style={{ fontSize: sizeFor(h.points), lineHeight: 1, color: "var(--hot)" }}>+{h.points}</span>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {list.map((r) => (
                    <Link key={r.member_id} href={`/dashboard/profile/${r.member_id}`}
                      style={{
                        border: `1px solid ${r.filed_it ? "var(--hot)" : "var(--line)"}`,
                        color: r.filed_it ? "var(--hot)" : "var(--dim)",
                        fontSize: 10, letterSpacing: ".1em", padding: "4px 9px",
                      }}>
                      {r.full_name.toUpperCase()}{r.filed_it ? " · FILED" : ""}
                    </Link>
                  ))}
                </div>
                {h.repo_url && (
                  <div style={{ padding: "0 16px 13px" }}>
                    <a href={h.repo_url} target="_blank" rel="noreferrer" className="lbl" style={{ fontSize: 9, color: "var(--ember)" }}>
                      {h.repo_url} ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ r }: { r: Credit }) {
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
      <span className="lbl val" style={{ fontSize: 9, color: "var(--faint)", minWidth: 66, paddingTop: 3 }}>{r.achievement_date}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: ".04em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
        <div className="lbl-faint" style={{ fontSize: 9, marginTop: 3 }}>
          {r.category} · {r.filed_it ? "FILED IT" : "WORKED ON IT"}
          {r.repo_url && <> · <a href={r.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--ember)" }}>SOURCE ↗</a></>}
        </div>
      </div>
      <span className="val" style={{ fontSize: sizeFor(r.points), lineHeight: 1, color: r.points >= 50 ? "var(--hot)" : "var(--bone)" }}>
        +{r.points}
      </span>
    </div>
  );
}

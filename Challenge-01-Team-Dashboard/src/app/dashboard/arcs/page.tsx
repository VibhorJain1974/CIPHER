"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nodeColour, sizeFor, sprintWeeks, tierOf, type TeamProgressRow } from "@/lib/types";

interface Weekly { member_id: string; week_index: number; points: number }
interface LogRow {
  id: string; member_id: string; full_name: string; title: string;
  category: string; venue: string | null; achievement_date: string; points: number;
}

const W = 1000, H = 340, PAD_L = 46, PAD_R = 132, PAD_T = 16, PAD_B = 40;

export default function ArcsScreen() {
  const [prog, setProg] = useState<TeamProgressRow[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: p }, { data: w }, { data: l }] = await Promise.all([
        supabase.from("team_progress").select("*").order("total_points", { ascending: false }),
        supabase.from("weekly_yield").select("*"),
        supabase.from("verified_log").select("*").order("achievement_date", { ascending: false }),
      ]);
      setProg((p as TeamProgressRow[]) ?? []);
      setWeekly((w as Weekly[]) ?? []);
      setLog((l as LogRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const weeks = sprintWeeks();

  const lines = useMemo(() => {
    return prog.map((m, i) => {
      let acc = 0;
      const pts = Array.from({ length: weeks }, (_, w) => {
        acc += weekly.filter((x) => x.member_id === m.member_id && x.week_index === w)
                     .reduce((s, x) => s + x.points, 0);
        return acc;
      });
      return { id: m.member_id, name: m.full_name, col: nodeColour(i), total: acc, cumulative: pts };
    });
  }, [prog, weekly, weeks]);

  const maxY = Math.max(...lines.map((l) => l.total), 100);
  const x = (i: number) => PAD_L + i * ((W - PAD_L - PAD_R) / Math.max(1, weeks - 1));
  const y = (v: number) => H - PAD_B - (v / maxY) * (H - PAD_T - PAD_B);

  // push end-labels apart so close finishers stay readable
  const endLabels = useMemo(() => {
    const sorted = lines.map((l, i) => ({ i, id: l.id, yy: y(l.total) })).sort((a, b) => a.yy - b.yy);
    let prev = -Infinity;
    const map: Record<string, number> = {};
    sorted.forEach((o) => { const yy = Math.max(o.yy, prev + 15); map[o.id] = yy; prev = yy; });
    return map;
  }, [lines, maxY]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = lines.find((l) => l.id === sel) ?? null;
  const selLog = sel ? log.filter((r) => r.member_id === sel) : [];
  const anyData = lines.some((l) => l.total > 0);

  if (loading) return <div className="lbl-faint">PLOTTING…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-hot">ARCS // CUMULATIVE YIELD FROM ZERO</span>
        <span className="lbl-faint">{sel ? "CLICK AGAIN TO RELEASE" : "CLICK AN ARC TO ISOLATE IT"}</span>
      </div>

      {(
        <div className="panel" style={{ padding: "18px 16px", position: "relative" }}>
          {!anyData && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 2, pointerEvents: "none" }}>
              <div style={{ textAlign: "center" }}>
                <div className="lbl-faint" style={{ marginBottom: 6 }}>NO SIGNAL</div>
                <div style={{ fontSize: 10, color: "var(--dimmer)" }}>
                  EVERY ARC BEGINS AT ZERO ON 01.09.26<span className="caret">_</span>
                </div>
              </div>
            </div>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
            {[0, .25, .5, .75, 1].map((f) => (
              <g key={f}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y(maxY * f)} y2={y(maxY * f)} stroke="var(--line-2)" strokeWidth={1} />
                <text x={PAD_L - 8} y={y(maxY * f) + 3} textAnchor="end" fontSize={9} fill="var(--faint)" letterSpacing=".1em">
                  {Math.round(maxY * f)}
                </text>
              </g>
            ))}
            {Array.from({ length: weeks }, (_, i) => (
              <text key={i} x={x(i)} y={H - PAD_B + 15} textAnchor="middle" fontSize={8} fill="var(--faint)" letterSpacing=".08em">
                W{i + 1}
              </text>
            ))}

            {lines.length === 0 && (
              <polyline points={`${x(0)},${y(0)} ${x(weeks - 1)},${y(0)}`}
                fill="none" stroke="var(--line)" strokeWidth={1.2} strokeDasharray="3 4" />
            )}

            {lines.map((l) => {
              const on = sel === null || sel === l.id;
              return (
                <polyline
                  key={l.id}
                  points={l.cumulative.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                  fill="none" stroke={l.col}
                  strokeWidth={sel === l.id ? 2.6 : 1.4}
                  opacity={on ? 1 : 0.14}
                  style={{ cursor: "pointer", transition: "opacity .18s, stroke-width .18s" }}
                  onClick={() => setSel(sel === l.id ? null : l.id)}
                />
              );
            })}

            {/* mark the heavy hits on the isolated arc */}
            {selected && selLog.filter((r) => r.points >= 20).map((r) => {
              const wk = Math.max(0, Math.floor((Date.parse(r.achievement_date) - Date.parse("2026-09-01")) / 6048e5));
              const v = selected.cumulative[Math.min(wk, weeks - 1)] ?? 0;
              return (
                <g key={r.id}>
                  <circle cx={x(Math.min(wk, weeks - 1))} cy={y(v)} r={3.4} fill={selected.col} />
                  <text x={x(Math.min(wk, weeks - 1)) + 8} y={y(v) - 7} fontSize={9} fill="var(--bone)" letterSpacing=".08em">
                    +{r.points} {r.category}
                  </text>
                </g>
              );
            })}

            {lines.map((l) => {
              const on = sel === null || sel === l.id;
              return (
                <text key={l.id} x={W - PAD_R + 10} y={(endLabels[l.id] ?? y(l.total)) + 3}
                  fontSize={10} fill={l.col} opacity={on ? 1 : 0.2} letterSpacing=".08em"
                  style={{ cursor: "pointer" }} onClick={() => setSel(sel === l.id ? null : l.id)}>
                  {l.name.toUpperCase().slice(0, 13)} {l.total}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 18, alignItems: "start" }}>
        <div className="panel">
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
            <span className="lbl">NODES</span>
          </div>
          {lines.length === 0 && <div style={{ padding: 16 }} className="lbl-faint">NONE ENROLLED</div>}
          {lines.map((l, i) => {
            const on = sel === null || sel === l.id;
            return (
              <button key={l.id} onClick={() => setSel(sel === l.id ? null : l.id)}
                style={{
                  width: "100%", display: "grid", gridTemplateColumns: "16px 1fr 84px 60px", gap: 10,
                  alignItems: "center", padding: "10px 14px", background: sel === l.id ? "var(--void-hot)" : "transparent",
                  border: "none", borderBottom: "1px solid var(--line-2)",
                  borderLeft: `2px solid ${sel === l.id ? l.col : "transparent"}`,
                  opacity: on ? 1 : .32, cursor: "pointer", textAlign: "left",
                }}>
                <span style={{ width: 9, height: 9, background: l.col, display: "inline-block" }} />
                <span style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--bone)" }}>{l.name.toUpperCase()}</span>
                <span className="lbl val" style={{ fontSize: 9, color: tierOf(l.total).col }}>{tierOf(l.total).code}</span>
                <span className="val" style={{ textAlign: "right", fontSize: 15, color: l.total ? "var(--hot)" : "var(--dimmer)" }}>{l.total}</span>
              </button>
            );
          })}
        </div>

        <div className="panel" style={{ minHeight: 200 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span className="lbl">{selected ? "WHAT DROVE IT" : "ISOLATE AN ARC"}</span>
            {selected && <span className="lbl-faint">{selLog.length} DECRYPTED</span>}
          </div>
          {!selected ? (
            <div style={{ padding: 18 }} className="lbl-faint">NO ARC SELECTED</div>
          ) : selLog.length === 0 ? (
            <div style={{ padding: 18 }} className="lbl-faint">NOTHING DECRYPTED FOR THIS NODE</div>
          ) : (
            selLog.map((r) => (
              <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", borderBottom: "1px solid var(--line-2)" }}>
                <span className="lbl val" style={{ fontSize: 9, color: "var(--faint)", minWidth: 62, paddingTop: 4 }}>
                  {r.achievement_date}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, letterSpacing: ".04em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
                  <div className="lbl-faint" style={{ fontSize: 9, marginTop: 2 }}>
                    {r.category}{r.venue ? " · " + r.venue.toUpperCase() : ""}
                  </div>
                </div>
                <span className="val" style={{ fontSize: sizeFor(r.points), lineHeight: 1, color: r.points >= 50 ? "var(--hot)" : "var(--bone)" }}>
                  +{r.points}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mass, pathTo, ranks, signalGrid, signalLevel, SIGNAL_STEPS } from "@/lib/glyphs";
import {
  tierOf, nodeColour, sprintWeeks, daysLeft,
  type TeamProgressRow, type RivalTeam, type PointRule,
} from "@/lib/types";

interface Weekly { member_id: string; week_index: number; points: number }
interface CatRow { category: string; total_points: number; verified_count: number }
interface HeatRow { achievement_date: string; verified_count: number }

export default function RankScreen() {
  const [rows, setRows] = useState<TeamProgressRow[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [rivals, setRivals] = useState<RivalTeam[]>([]);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [heat, setHeat] = useState<HeatRow[]>([]);
  const [rules, setRules] = useState<PointRule[]>([]);
  const [pulse, setPulse] = useState({ last_24h: 0, last_7d: 0 });
  const [latent, setLatent] = useState({ latent_points: 0, held_count: 0 });
  const [leads, setLeads] = useState(0);
  const [isCore, setIsCore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: me } = await sb.auth.getUser();
      const { data: myProfile } = me.user
        ? await sb.from("profiles").select("role").eq("id", me.user.id).maybeSingle()
        : { data: null };
      const core = myProfile?.role === "core";
      setIsCore(core);

      const [prog, wk, rv, ct, ht, rl, pl, lt, ld] = await Promise.all([
        sb.from("team_progress").select("*").order("total_points", { ascending: false }),
        sb.from("weekly_yield").select("*"),
        sb.from("rival_teams").select("*"),
        sb.from("team_category_breakdown").select("*").order("total_points", { ascending: false }),
        sb.from("team_activity_heatmap").select("*"),
        sb.from("point_rules").select("*"),
        sb.from("team_pulse").select("*").single(),
        sb.from("team_latent").select("*").single(),
        sb.from("profiles").select("id").eq("role", "core"),
      ]);
      setRows((prog.data as TeamProgressRow[]) ?? []);
      setWeekly((wk.data as Weekly[]) ?? []);
      setRivals((rv.data as RivalTeam[]) ?? []);
      setCats((ct.data as CatRow[]) ?? []);
      setHeat((ht.data as HeatRow[]) ?? []);
      setRules((rl.data as PointRule[]) ?? []);
      if (pl.data) setPulse(pl.data as typeof pulse);
      if (lt.data) setLatent(lt.data as typeof latent);
      setLeads(ld.data?.length ?? 0);
      setLoading(false);
    })();
  }, []);

  const weeks = sprintWeeks();
  const total = rows.reduce((s, r) => s + Number(r.total_points), 0);
  const onRelease = total + latent.latent_points;

  const board = [
    ...rivals.map((r) => ({ name: r.name, points: r.points, us: false })),
    { name: "CIPHER", points: total, us: true },
  ].sort((a, b) => b.points - a.points);

  const ourIdx = board.findIndex((b) => b.us);
  const above = ourIdx > 0 ? board[ourIdx - 1] : null;
  const below = ourIdx < board.length - 1 ? board[ourIdx + 1] : null;
  const rivalsUnset = rivals.every((r) => r.points === 0);

  const releaseRank =
    board.filter((t) => !t.us && t.points > onRelease).length + 1;

  const heatMap: Record<string, number> = {};
  heat.forEach((h) => { heatMap[h.achievement_date] = h.verified_count; });
  const heatPeak = Math.max(...heat.map((h) => h.verified_count), 1);
  const grid = signalGrid(heatMap);
  const liveDays = heat.filter((h) => h.verified_count > 0).length;

  const catPeak = Math.max(...cats.map((c) => Number(c.total_points)), 1);
  const place = ranks(rows.map((r) => Number(r.total_points)));

  if (loading) return <div className="lbl-faint">READING LEDGER…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--line-2)", border: "1px solid var(--line)" }}>

      {/* ── AGGREGATE + LATENT ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isCore ? "minmax(0,1.7fr) minmax(0,1fr)" : "minmax(0,1fr)", gap: 1, background: "var(--line-2)" }}>
        <div style={{ background: "var(--void)", padding: "22px 24px" }}>
          <div className="lbl-faint" style={{ marginBottom: 10 }}>AGGREGATE // DECRYPTED POINTS</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
            <div className="val" style={{ fontSize: 84, lineHeight: .8, fontWeight: 600, letterSpacing: "-.035em", color: total ? "var(--bone)" : "var(--dimmer)" }}>
              {total}
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div className="val" style={{ fontSize: 13, color: pulse.last_24h ? "var(--hot)" : "var(--faint)" }}>
                {pulse.last_24h > 0 ? "+" : ""}{pulse.last_24h} / 24H
              </div>
              <div className="lbl-faint" style={{ marginTop: 4 }}>{rows.length} NODES ACTIVE</div>
            </div>
          </div>

          <div className="rule" style={{ margin: "20px 0 16px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="lbl-faint" style={{ marginBottom: 6 }}>
                DEFICIT // {above ? above.name : "NONE"}
              </div>
              <div className="val" style={{ fontSize: 32, lineHeight: 1, color: above ? "var(--hot)" : "var(--bone)" }}>
                {above ? above.points - total : "—"}
              </div>
              <div className="lbl-faint" style={{ marginTop: 6, fontSize: 9 }}>
                {above ? pathTo(above.points - total + 1, rules) : "SUMMIT HELD"}
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--line-2)", paddingLeft: 20 }}>
              <div className="lbl-faint" style={{ marginBottom: 6 }}>
                MARGIN // {below ? below.name : "FLOOR"}
              </div>
              <div className="val" style={{ fontSize: 32, lineHeight: 1, color: "var(--bone)" }}>
                {below ? total - below.points : "—"}
              </div>
              <div className="lbl-faint" style={{ marginTop: 6, fontSize: 9 }}>
                {!below ? "NOTHING BELOW" : total - below.points < 60 ? "HOLD NOT GUARANTEED" : "STABLE"}
              </div>
            </div>
          </div>
        </div>

        {isCore && <div style={{ background: "var(--void)", padding: "22px 24px" }}>
          <div className="lbl-faint" style={{ marginBottom: 10 }}>
            LATENT // UNDECRYPTED <span style={{ color: "var(--hot)" }}>· CORE ONLY</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className={`val ${latent.latent_points ? "flick" : ""}`}
              style={{ fontSize: 56, lineHeight: .85, color: latent.latent_points ? "var(--hot)" : "var(--dimmer)" }}>
              {latent.latent_points}
            </div>
            {/* barcode: one tick per three held points */}
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 34, flex: 1, overflow: "hidden" }}>
              {Array.from({ length: Math.min(40, Math.ceil(latent.latent_points / 3)) }, (_, i) => (
                <span key={i} style={{
                  width: 2, background: "var(--hot)",
                  height: `${55 + ((i * 7) % 5) * 9}%`,
                  opacity: .35 + ((i * 7) % 6) / 9,
                }} />
              ))}
            </div>
          </div>
          <div className="lbl-faint" style={{ marginTop: 14, fontSize: 9, lineHeight: 1.9 }}>
            {latent.held_count} ARTEFACT{latent.held_count === 1 ? "" : "S"} HELD · {leads} LEAD{leads === 1 ? "" : "S"}
            <br />
            STANDING NOW — {String(ourIdx + 1).padStart(2, "0")} · ON RELEASE — {String(releaseRank).padStart(2, "0")}
          </div>
          <div className="rule" style={{ margin: "16px 0 14px" }} />
          <div className="lbl-faint" style={{ fontSize: 9, lineHeight: 1.9, color: "var(--dimmer)" }}>
            {latent.latent_points > 0 && above && onRelease > above.points
              ? "RELEASE TAKES SLOT " + String(releaseRank).padStart(2, "0")
              : latent.latent_points > 0
                ? "LATENT RELEASE PROJECTS " + String(releaseRank).padStart(2, "0") + " OF FIVE"
                : "NOTHING HELD · SEE THEATRE BELOW"}
          </div>
        </div>}
      </div>

      {/* ── THEATRE ────────────────────────────────────────────── */}
      <div style={{ background: "var(--void)", padding: "18px 24px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">THEATRE // 5 TEAMS</span>
          <span className="lbl-faint">
            {rivalsUnset ? "RIVAL TOTALS NOT ENTERED · SET THEM IN KEYS" : "LEFT COLUMN = COST TO TAKE THE SLOT"}
          </span>
        </div>
      </div>
      <div style={{ background: "var(--void)", paddingBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "96px 76px 34px minmax(0,1fr) 150px 200px 74px", gap: 12, padding: "0 24px 9px" }}>
          {["SLOT", "Δ", "#", "TEAM", "MASS", "SPREAD", "PTS"].map((h, i) => (
            <span key={h} className="lbl-faint" style={{ fontSize: 9, textAlign: i === 6 ? "right" : "left" }}>{h}</span>
          ))}
        </div>
        {board.map((t, i) => {
          const isAbove = i < ourIdx;
          const need = t.points - total + 1;
          const lead = total - t.points;
          const next = board[i + 1];
          const clears = isAbove && onRelease > t.points;
          return (
            <div key={t.name} style={{
              display: "grid", gridTemplateColumns: "96px 76px 34px minmax(0,1fr) 150px 200px 74px",
              gap: 12, alignItems: "center", padding: "13px 24px",
              borderTop: "1px solid var(--line-2)",
              background: t.us ? "var(--void-hot)" : "transparent",
              boxShadow: t.us ? "inset 3px 0 0 var(--hot)" : "none",
            }}>
              <span className="lbl" style={{ fontSize: 9, color: isAbove ? "var(--hot)" : t.us ? "var(--hot)" : "var(--faint)" }}>
                {t.us ? "CURRENT" : isAbove ? `TAKE ${String(i + 1).padStart(2, "0")}` : "HELD BY"}
              </span>
              <span className="val" style={{ fontSize: 17, color: isAbove ? "var(--hot)" : t.us ? "var(--dimmer)" : "var(--dim)" }}>
                {t.us ? "—" : isAbove ? `+${need}` : `+${lead}`}
              </span>
              <span className="lbl val" style={{ fontSize: 9, color: "var(--faint)" }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, letterSpacing: ".12em", color: t.us ? "var(--hot)" : isAbove ? "var(--bone)" : "var(--dim)" }}>
                  {t.name}
                </div>
                <div className="lbl-faint" style={{ fontSize: 9, marginTop: 3 }}>
                  {t.us ? "AGGREGATE LIVE"
                    : isAbove ? (clears ? <span style={{ color: "var(--hot)" }}>RELEASE CLEARS IT</span> : pathTo(need, rules))
                    : `CLEAR BY ${lead}`}
                </div>
              </div>
              <span className="val" style={{ fontSize: 11, letterSpacing: "1px", color: t.us ? "var(--hot)" : "var(--dimmer)" }}>
                {mass(t.points, 115, 13)}
              </span>
              <span className="lbl-faint" style={{ fontSize: 9 }}>
                {next ? `+${t.points - next.points} OVER ${next.name}` : "FLOOR"}
              </span>
              <span className="val" style={{ textAlign: "right", fontSize: 20, color: t.us ? "var(--hot)" : "var(--bone)" }}>
                {t.points}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── NODE LEDGER + MASS BY CATEGORY + SIGNAL ────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)", gap: 1, background: "var(--line-2)" }}>
        <div style={{ background: "var(--void)", paddingBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 24px 12px", flexWrap: "wrap", gap: 8 }}>
            <span className="lbl-hot">NODE LEDGER</span>
            <span className="lbl-faint">CUMULATIVE · NEVER AVERAGED</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr) 70px 88px 46px 46px 70px", gap: 10, padding: "0 24px 9px" }}>
            {["#", "NODE", "DEPT", "TIER", "VRF", "PND", "PTS"].map((h, i) => (
              <span key={h} className="lbl-faint" style={{ fontSize: 9, textAlign: i >= 4 ? "right" : "left" }}>{h}</span>
            ))}
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: "10px 24px 20px" }}>
              <div className="lbl-faint" style={{ marginBottom: 6 }}>NO NODES ENROLLED</div>
              <div style={{ fontSize: 11, color: "var(--dimmer)" }}>THE CREW SIGNS IN WITH THE TEAM CODE<span className="caret">_</span></div>
            </div>
          ) : rows.map((r, i) => {
            const tier = tierOf(Number(r.total_points));
            return (
              <Link key={r.member_id} href={`/dashboard/profile/${r.member_id}`}
                style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr) 70px 88px 46px 46px 70px", gap: 10, alignItems: "center", padding: "12px 24px", borderTop: "1px solid var(--line-2)", color: "inherit" }}>
                <span className="lbl val" style={{ fontSize: 9, color: place[i] === 1 ? "var(--hot)" : "var(--faint)" }}>{String(place[i]).padStart(2, "0")}</span>
                <span style={{ fontSize: 13, letterSpacing: ".06em", color: "var(--bone)" }}>{r.full_name.toUpperCase()}</span>
                <span className="lbl-faint" style={{ fontSize: 9 }}>{(r.department || "—").toUpperCase()}</span>
                <span className="lbl val" style={{ fontSize: 9, color: tier.col }}>{tier.code}</span>
                <span className="val" style={{ fontSize: 12, textAlign: "right", color: "var(--dim)" }}>{r.verified_count}</span>
                <span className="val" style={{ fontSize: 12, textAlign: "right", color: Number(r.pending_count) ? "var(--hot)" : "var(--faint)" }}>{r.pending_count}</span>
                <span className="val" style={{ fontSize: 17, textAlign: "right", color: Number(r.total_points) ? "var(--bone)" : "var(--dimmer)" }}>{r.total_points}</span>
              </Link>
            );
          })}
          {rows.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px 0", borderTop: "1px solid var(--line)", marginTop: 2 }}>
              <span className="lbl-faint" style={{ fontSize: 9 }}>TIER Ω≥250 I≥200 II≥150 III≥100 IV&lt;100</span>
              <span className="val" style={{ fontSize: 14, color: "var(--hot)" }}>{total}</span>
            </div>
          )}
        </div>

        <div style={{ background: "var(--void)" }}>
          <div style={{ padding: "18px 24px 12px" }}>
            <span className="lbl-hot">MASS BY CATEGORY</span>
          </div>
          <div style={{ padding: "0 24px 18px" }}>
            {cats.length === 0 ? (
              <div className="lbl-faint" style={{ fontSize: 10 }}>NO MASS YET<span className="caret">_</span></div>
            ) : cats.map((c) => (
              <div key={c.category} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) 46px", gap: 10, alignItems: "center", padding: "5px 0" }}>
                <span className="lbl-faint" style={{ fontSize: 9 }}>{c.category}</span>
                <span className="val" style={{
                  fontSize: 10, letterSpacing: "1px", lineHeight: 1,
                  color: Number(c.total_points) >= catPeak * .6 ? "var(--hot)" : "var(--ember)",
                  overflow: "hidden", whiteSpace: "nowrap",
                }}>
                  {mass(Number(c.total_points), Math.max(1, Math.round(catPeak / 16)), 18)}
                </span>
                <span className="val" style={{ fontSize: 12, textAlign: "right", color: "var(--dim)" }}>{c.total_points}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--line-2)", padding: "16px 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="lbl-hot">SIGNAL // 90D</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {grid.map((row, ri) => (
                <div key={ri} style={{ display: "flex", gap: 3 }}>
                  {row.map((c) => (
                    <span key={c.date} title={`${c.date} · ${c.count}`}
                      style={{
                        width: 13, height: 13, flexShrink: 0,
                        background: SIGNAL_STEPS[signalLevel(c.count, heatPeak)],
                      }} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <span className="lbl-faint" style={{ fontSize: 9 }}>
                {liveDays === 0 ? "DEAD" : `${liveDays}D LIVE`}
              </span>
              {heatPeak > 1 && <span className="lbl" style={{ fontSize: 9, color: "var(--hot)" }}>PEAK {heatPeak}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--void)", display: "flex", justifyContent: "space-between", padding: "12px 24px", flexWrap: "wrap", gap: 8 }}>
        <span className="lbl-faint" style={{ fontSize: 9 }}>// TECH SPRINT JOURNEY 2026</span>
        <span className="lbl-faint" style={{ fontSize: 9 }}>SHOWCASE 15.11.26 · {daysLeft()} DAYS</span>
      </div>
    </div>
  );
}

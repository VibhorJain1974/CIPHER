"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { divisionOf, sizeFor, sprintWeeks, tierOf, type Profile, type TeamProgressRow } from "@/lib/types";
import { badgesFor, radarAxes } from "@/lib/badges";
import AgentCard from "@/components/AgentCard";
import Radar from "@/components/Radar";
import BadgeWall from "@/components/BadgeWall";

interface Weekly { week_index: number; points: number }
interface LogRow {
  id: string; title: string; category: string; venue: string | null;
  rule_code: string | null; repo_url: string | null;
  achievement_date: string; points: number;
}

export default function FileScreen() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prog, setProg] = useState<TeamProgressRow | null>(null);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [own, setOwn] = useState(false);
  const [teamTotal, setTeamTotal] = useState(0);
  const [voided, setVoided] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isTop, setIsTop] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      setOwn(me === id);

      const [{ data: p }, { data: g }, { data: w }, { data: l }, { data: board }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("team_progress").select("*").eq("member_id", id).single(),
        supabase.from("weekly_yield").select("week_index, points").eq("member_id", id),
        supabase.from("verified_log").select("*").eq("member_id", id).order("achievement_date", { ascending: false }),
        supabase.from("team_progress").select("member_id, total_points").order("total_points", { ascending: false }),
      ]);
      setProfile(p as Profile);
      setProg(g as TeamProgressRow);

      const rows = (board ?? []) as { member_id: string; total_points: number }[];
      const mine = rows.findIndex((r) => r.member_id === id);
      if (mine >= 0) {
        const pts = Number(rows[mine].total_points);
        setRank(rows.filter((r) => Number(r.total_points) > pts).length + 1);
        setIsTop(pts > 0 && pts === Number(rows[0].total_points));
      }

      const { data: totals } = await supabase.from("team_totals").select("*").single();
      setTeamTotal(Number(totals?.team_total_points ?? 0));
      if (me === id) {
        const { data: rej } = await supabase.from("achievements")
          .select("id").eq("member_id", id).eq("status", "rejected");
        setVoided(rej?.length ?? 0);
      }
      setWeekly((w as Weekly[]) ?? []);
      setLog((l as LogRow[]) ?? []);

      if (me && me !== id) {
        await supabase.from("access_log").insert({ viewer_id: me, viewed_member_id: id, resource: "profile" });
      }
    })();
  }, [id]);

  if (!profile) return <div className="lbl-faint">OPENING FILE…</div>;

  const weeks = sprintWeeks();
  const total = Number(prog?.total_points ?? 0);
  const tier = tierOf(total);
  const div = divisionOf(profile.department);
  const series = Array.from({ length: weeks }, (_, w) =>
    weekly.filter((x) => x.week_index === w).reduce((s, x) => s + x.points, 0));
  const peak = Math.max(...series, 1);
  const peakWk = series.indexOf(Math.max(...series)) + 1;

  const entries = log.map((r) => ({
    points: r.points, category: r.category, rule_code: r.rule_code, achievement_date: r.achievement_date,
  }));
  const badges = badgesFor({ entries, total, voided, isTop });
  const axes = radarAxes({ entries, total });
  const share = teamTotal > 0 ? (total / teamTotal) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span className="lbl-hot">DOSSIER // {own ? "OWN NODE" : "READ ONLY"}</span>
        <span className="lbl-faint">{own ? "EDIT YOUR OWN ENTRIES FROM NODE" : "VIEWING IS LOGGED"}</span>
      </div>

      {/* ── card + instrument ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1.05fr) minmax(260px, .95fr)", gap: 16, alignItems: "stretch" }}>
        <AgentCard
          name={profile.full_name} department={profile.department}
          role={profile.role} locked={profile.locked} id={profile.id}
          points={total} rank={rank}
        />

        <div className="panel" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="lbl">SHAPE</span>
            <span className="lbl-faint">{total > 0 ? "READING" : "AT REST"}</span>
          </div>
          <div style={{ display: "grid", placeItems: "center", flex: 1, minHeight: 210 }}>
            <Radar axes={axes} col={div.col} />
          </div>
        </div>
      </div>

      {/* ── the four numbers ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1, background: "var(--line-2)" }}>
        <Stat label="POINTS" value={total} hot />
        <Stat label="DECRYPTED" value={prog?.verified_count ?? 0} />
        <Stat label="HELD" value={prog?.pending_count ?? 0} />
        {own && <Stat label="VOIDED" value={voided} />}
        <Stat label="TIER" value={tier.code} colour={tier.col} />
        <Stat label="MARKS" value={`${badges.filter((b) => b.earned).length}/${badges.length}`} />
      </div>

      <BadgeWall badges={badges} />

      {/* ── yield ─────────────────────────────────────────────────── */}
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <span className="lbl">WEEKLY YIELD</span>
          <span className="lbl-faint">{total > 0 ? `PEAK W${peakWk}` : "NOTHING BANKED YET"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
          {series.map((v, w) => (
            <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <span className="val" style={{ fontSize: 8, color: v ? "var(--dim)" : "transparent" }}>{v}</span>
              <div title={`W${w + 1} · ${v}`} style={{
                width: "100%", height: `${Math.max(2, (v / peak) * 62)}px`,
                background: v === 0 ? "var(--line)" : "var(--hot)",
              }} />
              <span className="lbl-faint" style={{ fontSize: 7 }}>{w + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── share ─────────────────────────────────────────────────── */}
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="lbl">SHARE OF TEAM TOTAL</span>
          <span className="lbl-faint">
            {teamTotal > 0 ? `${total} OF ${teamTotal} TEAM POINTS` : "TEAM IS ON ZERO — NOTHING TO SPLIT YET"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 10, background: "var(--line)", position: "relative" }}>
            <div style={{ height: "100%", width: `${Math.max(share > 0 ? 1.5 : 0, share)}%`, background: "var(--hot)" }} />
          </div>
          <span className="val" style={{ fontSize: 20, lineHeight: 1, color: share > 0 ? "var(--hot)" : "var(--dimmer)" }}>
            {share > 0 ? `${Math.round(share)}%` : "0%"}
          </span>
        </div>
      </div>

      {/* ── trail ─────────────────────────────────────────────────── */}
      <div className="panel">
        <div style={{ padding: "11px 15px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
          <span className="lbl">DECRYPTED TRAIL</span>
          <span className="lbl-faint">{log.length} ENTRIES</span>
        </div>
        {log.length === 0 ? (
          <div style={{ padding: "26px 20px" }}>
            <div className="lbl-faint" style={{ marginBottom: 7 }}>NOTHING DECRYPTED YET</div>
            <div style={{ fontSize: 11, color: "var(--dimmer)", lineHeight: 1.7 }}>
              {own
                ? <>File from NODE. It sits in the queue until a lead clears it, then it lands here with its weight.<span className="caret">_</span></>
                : <>This node has not banked anything yet.<span className="caret">_</span></>}
            </div>
          </div>
        ) : log.map((r) => (
          <div key={r.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 15px", borderBottom: "1px solid var(--line-2)" }}>
            <span className="lbl val" style={{ fontSize: 9, color: "var(--faint)", minWidth: 66, paddingTop: 4 }}>{r.achievement_date}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, letterSpacing: ".04em", color: "var(--bone)" }}>{r.title.toUpperCase()}</div>
              <div className="lbl-faint" style={{ fontSize: 9, marginTop: 3 }}>
                {r.category}{r.venue ? " · " + r.venue.toUpperCase() : ""}
                {r.repo_url && <> · <a href={r.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--ember)" }}>SOURCE</a></>}
              </div>
            </div>
            <span className="val" style={{ fontSize: sizeFor(r.points), lineHeight: 1, color: r.points >= 50 ? "var(--hot)" : "var(--bone)" }}>
              +{r.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hot, colour }: { label: string; value: number | string; hot?: boolean; colour?: string }) {
  return (
    <div style={{ background: "var(--panel-2)", padding: "14px 16px" }}>
      <div className="lbl-faint" style={{ marginBottom: 6, fontSize: 8 }}>{label}</div>
      <div className="val" style={{
        fontSize: typeof value === "string" ? 18 : 26, lineHeight: 1.2,
        color: colour ?? (hot && value ? "var(--hot)" : "var(--dim)"),
      }}>{value}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { accessLevel, barcode, divisionOf, recordId, sizeFor, sprintWeeks, tierOf, type Profile, type TeamProgressRow } from "@/lib/types";
import { badgesFor, radarAxes } from "@/lib/badges";
import AgentFigure from "@/components/AgentFigure";
import Radar from "@/components/Radar";
import BadgeWall from "@/components/BadgeWall";
import ProfileEdit from "@/components/ProfileEdit";

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
  const [viewerCore, setViewerCore] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeErr, setRemoveErr] = useState("");

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      setOwn(me === id);
      if (me) {
        const { data: viewer } = await supabase.from("profiles").select("role").eq("id", me).single();
        setViewerCore(viewer?.role === "core");
      }

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
  }, [id, tick]);

  if (!profile) return <div className="lbl-faint">OPENING FILE…</div>;

  const weeks = sprintWeeks();
  const total = Number(prog?.total_points ?? 0);
  const tier = tierOf(total);
  const div = divisionOf(profile.department);
  const lvl = accessLevel(profile.role, profile.locked);
  const series = Array.from({ length: weeks }, (_, w) =>
    weekly.filter((x) => x.week_index === w).reduce((s, x) => s + x.points, 0));
  const peak = Math.max(...series, 1);
  const peakWk = series.indexOf(Math.max(...series)) + 1;

  const entries = log.map((r) => ({
    points: r.points, category: r.category, rule_code: r.rule_code, achievement_date: r.achievement_date,
  }));
  const badges = badgesFor({ entries, total, voided, isTop });
  const axes = radarAxes({ entries });
  const share = teamTotal > 0 ? (total / teamTotal) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span className="lbl-hot">DOSSIER // {own ? "OWN NODE" : "READ ONLY"}</span>
        <span className="lbl-faint">{own ? "EDIT YOUR OWN ENTRIES FROM NODE" : "VIEWING IS LOGGED"}</span>
      </div>

      {/* ── theatre: who they are, what they look like, how they earn ── */}
      <div className="panel dossier-theatre">
        {/* identity */}
        <div style={{ padding: 20, borderRight: "1px solid var(--line-2)", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="lbl-faint" style={{ fontSize: 8, marginBottom: 6 }}>AGENT</div>
            <div style={{ fontSize: 26, letterSpacing: ".07em", color: "var(--bone)", lineHeight: 1.15, wordBreak: "break-word" }}>
              {profile.full_name.toUpperCase()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
              <span style={{ color: div.col, fontSize: 13, lineHeight: 1 }}>{div.glyph}</span>
              <span className="lbl" style={{ fontSize: 9, color: div.col }}>{div.name}</span>
            </div>
          </div>

          <div>
            <div className="lbl-faint" style={{ fontSize: 8, marginBottom: 6 }}>CLEARANCE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
              <span className="val" style={{ fontSize: 28, lineHeight: 1, color: lvl >= 4 ? "var(--hot)" : lvl === 3 ? "var(--bone)" : "var(--dim)" }}>{lvl}</span>
              <span className="lbl-faint" style={{ fontSize: 9 }}>
                {profile.role === "core" ? "COMMAND" : profile.role === "judge" ? "OBSERVER" : "FIELD"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 9 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{
                  width: 15, height: 4,
                  background: i <= lvl ? (lvl >= 4 ? "var(--hot)" : div.col) : "var(--line)",
                }} />
              ))}
            </div>
          </div>

          <div className="rule" />

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <Row k="RECORD" v={recordId(profile.id)} />
            <Row k="UNIT" v={`CIPHER / ${div.code}`} />
            <Row k="STANDING" v={rank ? `${tier.code} · ${String(rank).padStart(2, "0")}` : tier.code} hot />
            <Row k="WINDOW" v="01.09 . 15.11" />
          </div>

          {(profile.github_url || profile.linkedin_url) && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer noopener" className="link-chip">GITHUB ↗</a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer noopener" className="link-chip">LINKEDIN ↗</a>
              )}
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 22 }}>
              {barcode(profile.id, 40).map((w, i) => (
                <span key={i} style={{
                  width: w, height: "100%",
                  background: i % 5 === 0 ? div.col : "var(--dimmer)",
                  opacity: i % 3 === 0 ? 0.9 : 0.42,
                }} />
              ))}
            </div>
            <div className="lbl-faint" style={{ fontSize: 7, marginTop: 5, letterSpacing: ".3em" }}>SEALED</div>
          </div>
        </div>

        {/* the figure */}
        <div style={{
          display: "grid", placeItems: "center", padding: "18px 10px", position: "relative",
          borderRight: "1px solid var(--line-2)", overflow: "hidden",
          background: `radial-gradient(90% 70% at 50% 62%, ${div.col}14, transparent 70%)`,
        }}>
          <AgentFigure id={profile.id} name={profile.full_name} col={div.col} height={330} live={total > 0 || profile.role === "core"} />
          <div className="lbl-faint" style={{ position: "absolute", bottom: 12, fontSize: 8, letterSpacing: ".3em" }}>
            {total > 0 ? "ACTIVE" : "STANDING BY"}
          </div>
        </div>

        {/* the instrument */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="lbl">SHAPE</span>
            <span className="lbl-faint">{total > 0 ? "READING" : "AT REST"}</span>
          </div>
          <div style={{ display: "grid", placeItems: "center", flex: 1, minHeight: 250 }}>
            <Radar axes={axes} col={div.col} />
          </div>
          <div className="lbl-faint" style={{ fontSize: 8, lineHeight: 1.8, marginTop: 4 }}>
            EACH AXIS IS REAL POINTS BANKED IN THAT PART OF THE CODEX
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

      <BadgeWall badges={badges} col={div.col} canReplay={own || viewerCore} />

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
            {teamTotal > 0 ? `${total} OF ${teamTotal} TEAM POINTS` : "TEAM IS ON ZERO, NOTHING TO SPLIT YET"}
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
      {own && (
        <ProfileEdit
          id={profile.id}
          department={profile.department}
          github={profile.github_url}
          linkedin={profile.linkedin_url}
          phone={profile.phone}
          onSaved={() => setTick((t) => t + 1)}
        />
      )}

      {viewerCore && !own && !profile.locked && (
        <div className="panel" style={{ padding: 18, borderColor: "var(--ember)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <span className="lbl" style={{ color: "var(--hot)" }}>CORE // REMOVE NODE</span>
            <span className="lbl-faint" style={{ fontSize: 8 }}>LOGGED TO THE AUDIT TRAIL</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.75, marginBottom: 14 }}>
            Removing {profile.full_name.toUpperCase()} deletes their account, their entries,
            their proof, their marks and their messages. It cannot be undone, and any points
            they contributed leave the team total with them.
          </div>
          {!confirmRemove ? (
            <button className="btn" onClick={() => { setConfirmRemove(true); setRemoveErr(""); }}>
              REMOVE THIS NODE
            </button>
          ) : (
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn btn-hot" disabled={removing} onClick={async () => {
                setRemoving(true); setRemoveErr("");
                const { error } = await createClient().rpc("remove_member", { p_id: profile.id });
                setRemoving(false);
                if (error) { setRemoveErr(error.message.toUpperCase()); return; }
                window.location.href = "/dashboard/roster";
              }}>
                {removing ? "REMOVING…" : `CONFIRM · REMOVE ${profile.full_name.toUpperCase()}`}
              </button>
              <button className="btn" onClick={() => setConfirmRemove(false)}>CANCEL</button>
            </div>
          )}
          {removeErr && <div className="lbl" style={{ color: "var(--hot)", marginTop: 10 }}>{removeErr}</div>}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
      <span className="lbl-faint" style={{ fontSize: 8 }}>{k}</span>
      <span className="val" style={{ fontSize: 10, letterSpacing: ".06em", color: hot ? "var(--hot)" : "var(--bone)" }}>{v}</span>
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

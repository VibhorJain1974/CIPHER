"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sprintWeeks, type Profile, type TeamProgressRow } from "@/lib/types";
import { ranks } from "@/lib/glyphs";
import AgentCard from "@/components/AgentCard";
import CrewDossier, { type CrewEntry } from "@/components/CrewDossier";
import { badgesFor } from "@/lib/badges";

interface Weekly { member_id: string; week_index: number; points: number }
interface LogRow extends CrewEntry { member_id: string; rule_code: string | null }

export default function CrewScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [prog, setProg] = useState<TeamProgressRow[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: p }, { data: g }, { data: w }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("team_progress").select("*").order("total_points", { ascending: false }),
        supabase.from("weekly_yield").select("*"),
        supabase.from("verified_log").select("member_id, title, category, rule_code, achievement_date, points")
          .order("achievement_date", { ascending: false }),
      ]);
      setLog((l as LogRow[]) ?? []);
      setProfiles((p as Profile[]) ?? []);
      setProg((g as TeamProgressRow[]) ?? []);
      setWeekly((w as Weekly[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const weeks = sprintWeeks();
  if (loading) return <div className="lbl-faint">READING CREW…</div>;

  // Leads run the board, they do not compete on it. They sit above the
  // ranking on their own cards so their zero is never read as a last place.
  const leads = profiles
    .filter((p) => p.role === "core")
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
  const judges = profiles
    .filter((p) => p.role === "judge")
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const staffIds = new Set([...leads, ...judges].map((l) => l.id));
  const field = prog.filter((m) => !staffIds.has(m.member_id));
  const place = ranks(field.map((m) => Number(m.total_points)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── command ───────────────────────────────────────────────── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">COMMAND // {leads.length}</span>
          <span className="lbl-faint">RUNS THE BOARD · NOT RANKED ON IT</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {leads.map((l) => (
            <Link key={l.id} href={`/dashboard/profile/${l.id}`} style={{ color: "inherit", display: "block" }}>
              <AgentCard name={l.full_name} department={l.department} role={l.role} locked={l.locked} id={l.id} compact />
            </Link>
          ))}
        </div>
      </section>

      {/* ── observers ─────────────────────────────────────────────── */}
      {judges.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span className="lbl-hot">OBSERVERS // {judges.length}</span>
            <span className="lbl-faint">READ AND VERIFY · NOT RANKED</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            {judges.map((j) => (
              <Link key={j.id} href={`/dashboard/profile/${j.id}`} style={{ color: "inherit", display: "block" }}>
                <AgentCard name={j.full_name} department={j.department || "OBSERVERS"}
                  role={j.role} locked={j.locked} id={j.id} compact />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── field ─────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">FIELD // {field.length} NODES</span>
          <span className="lbl-faint">RANK IS LIVE · PROFILES ARE READ ONLY</span>
        </div>

        {field.length === 0 ? (
          <div className="panel" style={{ padding: 24 }}>
            <div className="lbl-faint" style={{ marginBottom: 6 }}>NO NODES ENROLLED</div>
            <div style={{ fontSize: 11, color: "var(--dimmer)" }}>
              THE CREW SIGNS IN WITH THE CODE MINTED FOR THEM IN KEYS<span className="caret">_</span>
            </div>
          </div>
        ) : (
          <div className="crew-grid">
            {field.map((m, i) => {
              const series = Array.from({ length: weeks }, (_, w) =>
                weekly.filter((x) => x.member_id === m.member_id && x.week_index === w)
                  .reduce((s, x) => s + x.points, 0));
              const prof = profiles.find((p) => p.id === m.member_id);
              const mine = log.filter((r) => r.member_id === m.member_id);
              const pts = Number(m.total_points);
              const badges = badgesFor({
                entries: mine.map((r) => ({
                  points: r.points, category: r.category,
                  rule_code: r.rule_code, achievement_date: r.achievement_date,
                })),
                total: pts,
                voided: 0,
                isTop: pts > 0 && pts === Number(field[0].total_points),
              });
              return (
                <CrewDossier
                  key={m.member_id}
                  id={m.member_id}
                  name={m.full_name}
                  department={m.department}
                  role={prof?.role ?? "member"}
                  locked={prof?.locked ?? false}
                  points={pts}
                  rank={place[i]}
                  verified={Number(m.verified_count)}
                  held={Number(m.pending_count)}
                  marks={badges.filter((b) => b.earned).length}
                  badges={badges}
                  entries={mine}
                  series={series}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { divisionOf, nodeColour, sprintWeeks, tierOf, type Profile, type TeamProgressRow } from "@/lib/types";
import { ranks } from "@/lib/glyphs";
import AgentCard from "@/components/AgentCard";

interface Weekly { member_id: string; week_index: number; points: number }

export default function CrewScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [prog, setProg] = useState<TeamProgressRow[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: p }, { data: g }, { data: w }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("team_progress").select("*").order("total_points", { ascending: false }),
        supabase.from("weekly_yield").select("*"),
      ]);
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
  const leadIds = new Set(leads.map((l) => l.id));

  const field = prog.filter((m) => !leadIds.has(m.member_id));
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {field.map((m, i) => {
              const tier = tierOf(Number(m.total_points));
              const div = divisionOf(m.department);
              const col = Number(m.total_points) > 0 ? div.col : nodeColour(i);
              const above = i > 0 ? Number(field[i - 1].total_points) : null;
              const series = Array.from({ length: weeks }, (_, w) =>
                weekly.filter((x) => x.member_id === m.member_id && x.week_index === w)
                  .reduce((s, x) => s + x.points, 0));
              const peak = Math.max(...series, 1);
              return (
                <Link key={m.member_id} href={`/dashboard/profile/${m.member_id}`} className="panel"
                  style={{ padding: 15, color: "inherit", display: "block", borderLeft: `2px solid ${col}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span className="lbl val" style={{ color: place[i] === 1 ? "var(--hot)" : "var(--faint)" }}>
                      {String(place[i]).padStart(2, "0")}
                    </span>
                    <span className="lbl val" style={{ fontSize: 9, color: tier.col }}>{tier.code}</span>
                  </div>
                  <div style={{ fontSize: 14, letterSpacing: ".06em", color: "var(--bone)", marginBottom: 2 }}>
                    {m.full_name.toUpperCase()}
                  </div>
                  <div className="lbl-faint" style={{ fontSize: 9, marginBottom: 13 }}>
                    <span style={{ color: div.col }}>{div.glyph} {div.code}</span> · {(m.department || "—").toUpperCase()}
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 34, marginBottom: 11 }}>
                    {series.map((v, w) => (
                      <span key={w} title={`W${w + 1} · ${v}`} style={{
                        flex: 1, height: `${Math.max(2, (v / peak) * 100)}%`,
                        background: v === 0 ? "var(--line)" : w >= weeks - 2 ? col : "var(--dimmer)",
                      }} />
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div className="lbl-faint" style={{ fontSize: 9 }}>
                        {m.verified_count} DECRYPTED
                        {Number(m.pending_count) > 0 && <span style={{ color: "var(--hot)" }}> · {m.pending_count} HELD</span>}
                      </div>
                      <div className="lbl val" style={{ fontSize: 9, marginTop: 3, color: above === null ? "var(--bone)" : "var(--hot)" }}>
                        {above === null || above === Number(m.total_points)
                          ? `HOLDING ${String(place[i]).padStart(2, "0")}`
                          : `−${above - Number(m.total_points)} TO ${String(place[i] - 1).padStart(2, "0")}`}
                      </div>
                    </div>
                    <span className="val" style={{ fontSize: 30, lineHeight: 1, color: Number(m.total_points) ? "var(--hot)" : "var(--dimmer)" }}>
                      {m.total_points}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

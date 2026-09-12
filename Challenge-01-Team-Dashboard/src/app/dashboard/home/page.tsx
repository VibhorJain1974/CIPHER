"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { divisionOf, type Profile } from "@/lib/types";
import { avatarOf, photoPending, realPhotoOf } from "@/lib/avatars";

/**
 * What the doors open onto. No rank, no points — the board asked for a
 * homepage that just says who this team is before anything gets scored.
 * Leads sit in their own row for the same reason they sit apart on the
 * roster: they run the board, they are not competing on it.
 */
export default function TeamHomeScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("*")
      .order("full_name")
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="lbl-faint">READING CREW…</div>;

  const visible = profiles.filter((p) => !p.hidden);
  const leads = visible.filter((p) => p.role === "core");
  const judges = visible.filter((p) => p.role === "judge");
  const staffIds = new Set([...leads, ...judges].map((p) => p.id));
  const members = visible.filter((p) => !staffIds.has(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* ── wordmark ─────────────────────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "38px 0 6px" }}>
        <img src="/cipher-shield.png" alt="" style={{ width: 84, height: 84, objectFit: "contain" }} />
        <div style={{ fontSize: "clamp(40px, 9vw, 68px)", fontWeight: 800, letterSpacing: ".08em", lineHeight: 1 }}>
          CIPHER
        </div>
        <div className="lbl-faint" style={{ fontSize: 10, letterSpacing: ".24em" }}>
          AARVAK · TECH SPRINT JOURNEY 2026
        </div>
      </section>

      {leads.length > 0 && (
        <TeamRow title="LEADS" people={leads} />
      )}

      <TeamRow title="CREW" people={members} />

      {judges.length > 0 && (
        <TeamRow title="OBSERVERS" people={judges} />
      )}
    </div>
  );
}

function TeamRow({ title, people }: { title: string; people: Profile[] }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="lbl-hot" style={{ fontSize: 10 }}>{title}</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 18,
      }}>
        {people.map((p) => {
          const div = divisionOf(p.department);
          const pending = photoPending(p.id, p.full_name);
          const art = pending ? null : realPhotoOf(p.id, p.full_name) ?? avatarOf(p.id, p.full_name);
          return (
            <Link
              key={p.id}
              href={`/dashboard/profile/${p.id}`}
              className="panel"
              style={{
                display: "flex", flexDirection: "column", overflow: "hidden",
                textDecoration: "none", color: "inherit",
              }}
            >
              <div style={{
                aspectRatio: "3 / 4", position: "relative", overflow: "hidden",
                background: art ? `linear-gradient(180deg, transparent 55%, var(--panel-2) 100%), var(--void)`
                  : "var(--panel-2)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
              }}>
                {pending ? (
                  <div style={{
                    width: "100%", height: "100%", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", border: "1px dashed var(--line)",
                      display: "grid", placeItems: "center", fontSize: 16, color: "var(--faint)",
                    }}>?</div>
                    <div className="lbl-faint" style={{ fontSize: 8, letterSpacing: ".14em", textAlign: "center" }}>
                      PHOTO<br />COMING SOON
                    </div>
                  </div>
                ) : art ? (
                  <img src={art} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%", display: "grid", placeItems: "center",
                    fontSize: 30, fontWeight: 700, color: div.col,
                  }}>
                    {p.full_name.trim().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 11px 13px" }}>
                <div style={{ fontSize: 12, letterSpacing: ".04em" }}>{p.full_name.toUpperCase()}</div>
                <div className="lbl-faint" style={{ fontSize: 9, marginTop: 3, color: div.col }}>
                  {p.department || div.code}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

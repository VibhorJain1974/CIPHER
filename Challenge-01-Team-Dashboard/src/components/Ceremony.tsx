"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { badgesFor } from "@/lib/badges";
import BadgeMedal from "./BadgeMedal";

/**
 * When a member strikes a mark, it is assembled on their screen out of a
 * field of ones and zeroes converging from every edge, then held for a beat
 * and dismissed. It fires exactly once per mark, ever, on whatever screen
 * they happen to be on: the award row carries a seen_at that is stamped the
 * moment the ceremony plays, so a refresh or a second device cannot replay it.
 */

const CELLS = 150;

export default function Ceremony({ userId }: { userId: string }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  // pick up anything struck while they were away, then listen live
  useEffect(() => {
    const sb = createClient();
    let alive = true;

    const pull = async () => {
      const { data } = await sb.from("mark_awards")
        .select("code").eq("member_id", userId).is("seen_at", null)
        .order("struck_at", { ascending: true });
      if (alive && data?.length) setQueue((q) => [...q, ...data.map((r) => r.code).filter((c) => !q.includes(c))]);
    };
    pull();

    const ch = sb.channel("marks-" + userId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mark_awards", filter: `member_id=eq.${userId}` },
        (p) => setQueue((q) => q.includes(p.new.code as string) ? q : [...q, p.new.code as string]))
      .subscribe();

    return () => { alive = false; sb.removeChannel(ch); };
  }, [userId]);

  const code = queue[0];

  useEffect(() => {
    if (!code) return;
    setPhase("in");
    const t1 = setTimeout(() => setPhase("hold"), 1500);
    const t2 = setTimeout(() => setPhase("out"), 4600);
    const t3 = setTimeout(async () => {
      await createClient().from("mark_awards")
        .update({ seen_at: new Date().toISOString() })
        .eq("member_id", userId).eq("code", code);
      setQueue((q) => q.slice(1));
    }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [code, userId]);

  if (!code) return null;

  const spec = badgesFor({ entries: [], total: 0, voided: 0, isTop: false }).find((b) => b.code === code);
  if (!spec) return null;

  return (
    <div className={`cer cer-${phase}`} aria-live="polite">
      {/* the field: every cell starts off-screen and converges on the medal */}
      <div className="cer-field" aria-hidden>
        {Array.from({ length: CELLS }, (_, i) => {
          const edge = i % 4;
          const p = ((i * 37) % 100) / 100;
          const from =
            edge === 0 ? { x: `${p * 100 - 50}vw`, y: "-60vh" } :
            edge === 1 ? { x: "60vw", y: `${p * 100 - 50}vh` } :
            edge === 2 ? { x: `${p * 100 - 50}vw`, y: "60vh" } :
                         { x: "-60vw", y: `${p * 100 - 50}vh` };
          const hue = [0, 22, 42, 190][i % 4];
          return (
            <span key={i} className="cer-bit" style={{
              ["--fx" as string]: from.x,
              ["--fy" as string]: from.y,
              ["--tx" as string]: `${((i * 53) % 40) - 20}px`,
              ["--ty" as string]: `${((i * 29) % 40) - 20}px`,
              color: `hsl(${hue} 90% 58%)`,
              animationDelay: `${(i % 26) * 0.022}s`,
            }}>{i % 2 ? "1" : "0"}</span>
          );
        })}
      </div>

      <div className="cer-core">
        <div className="cer-medal"><BadgeMedal code={code} weight={spec.weight} earned size={190} /></div>
        <div className="cer-kicker">MARK STRUCK</div>
        <div className="cer-name">{spec.name}</div>
        <div className="cer-blurb">{spec.blurb}</div>
        <div className="cer-rar">
          {Array.from({ length: spec.weight }, (_, i) => <span key={i} />)}
          <em>RARITY {spec.weight}</em>
        </div>
      </div>

      <button className="cer-skip" onClick={async () => {
        await createClient().from("mark_awards")
          .update({ seen_at: new Date().toISOString() })
          .eq("member_id", userId).eq("code", code);
        setQueue((q) => q.slice(1));
      }}>DISMISS</button>
    </div>
  );
}

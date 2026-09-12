"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { badgesFor } from "@/lib/badges";
import CeremonyStage from "./CeremonyStage";

const SPECS = badgesFor({ entries: [], total: 0, voided: 0, isTop: false });

/**
 * Watches for marks this member has struck but not yet seen, and plays each
 * one. Fires on whatever screen they are on, exactly once per mark, ever:
 * the award row carries a seen_at stamped the moment the strike plays, so a
 * refresh or a second device cannot replay it.
 *
 * Note it only ever fires for the member who earned the mark. Watching
 * someone else's account will never show you their strike — use the replay
 * button on a mark's card for that.
 */
export default function Ceremony({ userId }: { userId: string }) {
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    const sb = createClient();
    let alive = true;

    (async () => {
      const { data } = await sb.from("mark_awards")
        .select("code").eq("member_id", userId).is("seen_at", null)
        .order("struck_at", { ascending: true });
      if (alive && data?.length) {
        setQueue((q) => [...q, ...data.map((r) => r.code as string).filter((c) => !q.includes(c))]);
      }
    })();

    const ch = sb.channel("marks-" + userId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mark_awards", filter: `member_id=eq.${userId}` },
        (p) => setQueue((q) => (q.includes(p.new.code as string) ? q : [...q, p.new.code as string])))
      .subscribe();

    return () => { alive = false; sb.removeChannel(ch); };
  }, [userId]);

  const code = queue[0];

  const done = useCallback(async () => {
    if (!code) return;
    await createClient().from("mark_awards")
      .update({ seen_at: new Date().toISOString() })
      .eq("member_id", userId).eq("code", code);
    setQueue((q) => q.slice(1));
  }, [code, userId]);

  const badge = SPECS.find((b) => b.code === code);
  if (!badge) return null;

  return <CeremonyStage badge={badge} onDone={done} />;
}

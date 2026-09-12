"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogArtefact from "@/components/LogArtefact";
import MyLedger from "@/components/MyLedger";
import Codex from "@/components/Codex";

export default function NodeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data } = await sb.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!uid) return;
      const { data: p } = await sb.from("profiles").select("role").eq("id", uid).single();
      if (p?.role === "judge") { router.replace("/dashboard/review"); return; }
      setUserId(uid);
    })();
  }, [router]);

  if (!userId) return <div className="lbl-faint">AUTHENTICATING…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <LogArtefact userId={userId} onFiled={() => setKey((k) => k + 1)} />
        <MyLedger userId={userId} refreshKey={key} />
      </div>
      <Codex />
    </div>
  );
}

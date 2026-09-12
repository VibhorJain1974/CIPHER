"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Recovery path for an account that exists in auth but has no profile row.
 * Happens when signup is interrupted between the auth record and the profile
 * insert (email confirmation, closed tab, network drop). Without this the
 * user lands in the dashboard as a ghost with no name and no clearance.
 */
export default function EnrolScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
      if (p) router.replace("/dashboard/home");
    })();
  }, [router]);

  async function complete(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const supabase = createClient();
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("NOT AUTHENTICATED");

      const { data: role, error: rpcErr } = await supabase.rpc("redeem_invite", { p_code: code.trim() });
      if (rpcErr || !role) throw new Error("That team code is not valid. Ask a team lead for the current one.");

      const { error: pErr } = await supabase.from("profiles")
        .insert({ id: uid, full_name: name.trim(), department: dept.trim(), role: "member" });
      if (pErr) throw pErr;

      // this path runs with a live session, so the role is claimed here
      if (role !== "member") {
        const { error: cErr } = await supabase.rpc("claim_role", { p_code: code.trim() });
        if (cErr) throw cErr;
      }
      router.replace("/dashboard/home");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 370 }}>
        <div className="lbl-hot" style={{ marginBottom: 6 }}>INIT // INCOMPLETE NODE</div>
        <div style={{ fontSize: 24, letterSpacing: ".16em", marginBottom: 10 }}>FINISH ENROLMENT</div>
        <div className="lbl-faint" style={{ marginBottom: 24, fontSize: 9, lineHeight: 1.7 }}>
          Signed in as {email} · your profile was never finished, so complete it here
        </div>
        <form onSubmit={complete} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>FULL NAME</div>
            <input className="fld" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>DEPARTMENT</div>
            <input className="fld" required value={dept} onChange={(e) => setDept(e.target.value)} />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>TEAM CODE <span style={{ color: "var(--faint)" }}>· ASK A TEAM LEAD</span></div>
            <input className="fld val" required value={code} onChange={(e) => setCode(e.target.value)}
              style={{ letterSpacing: ".2em" }} />
          </label>
          {err && <div className="lbl" style={{ color: "var(--hot)" }}>{err}</div>}
          <button className="btn btn-hot" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "ATTACHING…" : "ATTACH NODE"}
          </button>
        </form>
      </div>
    </main>
  );
}

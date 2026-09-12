"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DecryptField from "@/components/DecryptField";
import ThemeToggle from "@/components/ThemeToggle";

export default function InitScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function enrol(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const supabase = createClient();
    try {
      // check the code first so a bad one fails before an account exists
      const { error: rpcErr } = await supabase.rpc("redeem_invite", { p_code: code.trim() });
      if (rpcErr) {
        const m = rpcErr.message || "";
        if (m.includes("code_already_used")) throw new Error("That code has already been used. Every member gets their own — ask a lead to mint you a fresh one.");
        if (m.includes("code_expired")) throw new Error("That code has expired. Ask a lead for a new one.");
        throw new Error("That code is not valid. Check it character for character, or ask a lead for a new one.");
      }

      const { data: signUp, error: suErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // the database trigger reads these and builds the profile row,
          // resolving clearance from the code on the server side
          data: {
            full_name: name.trim(),
            department: dept.trim(),
            invite_code: code.trim(),
          },
        },
      });
      if (suErr) throw suErr;

      // Supabase deliberately returns a success shape for an email that already
      // exists (it refuses to confirm account existence to a stranger). For our
      // own crew that silence is just a dead end, so name it.
      const uid = signUp.user?.id;
      if (!uid || signUp.user?.identities?.length === 0) {
        throw new Error("That email already has an account. Sign in instead.");
      }

      // With confirmation switched off the session lands immediately and the
      // member walks straight in. With it on, they get told exactly what to do.
      if (signUp.session) {
        router.push("/dashboard/leaderboard");
        router.refresh();
        return;
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, position: "relative" }}>
      <DecryptField />
      <div style={{ position: "fixed", top: 16, right: 18, zIndex: 3 }}><ThemeToggle /></div>
      <div className="glass-card" style={{ width: "100%", maxWidth: 370, position: "relative", zIndex: 2, background: "var(--void)", border: "1px solid var(--line)", padding: 26 }}>
        <div className="lbl-hot" style={{ marginBottom: 6 }}>INIT</div>
        <div style={{ fontSize: 26, letterSpacing: ".2em", marginBottom: 26 }}>ENROL</div>

        {done ? (
          <div>
            <div className="lbl" style={{ color: "var(--bone)", marginBottom: 10 }}>NODE CREATED</div>
            <ol style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.85, paddingLeft: 16, margin: 0 }}>
              <li>Open the mail from Supabase and click the confirm link.</li>
              <li>
                The page it opens may say <span style={{ color: "var(--hot)" }}>this site can&apos;t be reached</span>.
                That is fine. Your account is already confirmed at that point.
              </li>
              <li>Come back here and sign in.</li>
            </ol>
            <Link href="/login" className="btn btn-hot" style={{ display: "inline-block", marginTop: 16 }}>
              GO TO SIGN IN
            </Link>
          </div>
        ) : (
          <form onSubmit={enrol} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <label>
              <div className="lbl" style={{ marginBottom: 6 }}>FULL NAME</div>
              <input className="fld" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <div className="lbl" style={{ marginBottom: 6 }}>DEPARTMENT</div>
              <input className="fld" required value={dept} onChange={(e) => setDept(e.target.value)} placeholder="HR & OPERATIONS / TECH / DESIGN" />
            </label>
            <label>
              <div className="lbl" style={{ marginBottom: 6 }}>EMAIL</div>
              <input className="fld" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              <div className="lbl" style={{ marginBottom: 6 }}>PASSWORD <span style={{ color: "var(--faint)" }}>· MIN 6 CHARACTERS</span></div>
              <input className="fld" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
            </label>
            <label>
              <div className="lbl" style={{ marginBottom: 6 }}>TEAM CODE <span style={{ color: "var(--faint)" }}>· ASK A TEAM LEAD</span></div>
              <input className="fld val" required value={code} onChange={(e) => setCode(e.target.value)}
                style={{ letterSpacing: ".2em" }} />
            </label>
            {err && <div className="lbl" style={{ color: "var(--hot)" }}>{err}</div>}
            <button className="btn btn-hot" type="submit" disabled={busy} style={{ marginTop: 4 }}>
              {busy ? "ENROLLING…" : "ENROL"}
            </button>
          </form>
        )}

        <div className="lbl-faint" style={{ marginTop: 22, fontSize: 9 }}>
          Already have an account? <Link href="/login" style={{ color: "var(--hot)" }}>SIGN IN</Link>
        </div>
      </div>
    </main>
  );
}

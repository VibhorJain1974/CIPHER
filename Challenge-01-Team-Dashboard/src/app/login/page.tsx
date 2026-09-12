"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DecryptField from "@/components/DecryptField";
import ThemeToggle from "@/components/ThemeToggle";
import VaultDoor from "@/components/VaultDoor";

export default function EntryScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [opening, setOpening] = useState(false);

  // the callback bounces here after a confirm link is spent
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("confirmed")) {
      setNote("Link handled. Sign in below.");
    }
  }, []);

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    setNote(""); setUnconfirmed(false);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      const m = (error.message || "").toLowerCase();
      if (m.includes("not confirmed")) {
        setUnconfirmed(true);
        setErr("This account is not confirmed yet. Open the mail and click the link — the page it lands on may look broken, that is fine — then sign in.");
      } else if (m.includes("invalid login")) {
        setErr("Email or password is wrong. If you have never enrolled, use ENROL with the code your lead gave you.");
      } else {
        setErr(error.message);
      }
      return;
    }
    // the doors part, then the board is behind them
    setOpening(true);
    setTimeout(() => { router.push("/dashboard/leaderboard"); router.refresh(); }, 1150);
  }

  async function resend() {
    if (!email.trim()) { setErr("Put your email in first."); return; }
    setBusy(true); setErr("");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    setNote(error ? error.message : "Sent again. Check your inbox, and the spam folder.");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, position: "relative" }}>
      <DecryptField />
      <VaultDoor open={opening} />
      <div style={{ position: "fixed", top: 16, right: 18, zIndex: 3 }}><ThemeToggle /></div>
      <div className="glass-card" style={{ width: "100%", maxWidth: 340, position: "relative", zIndex: 60,
        opacity: opening ? 0 : 1, transform: opening ? "scale(.97)" : "none",
        transition: "opacity .35s ease, transform .35s ease", pointerEvents: opening ? "none" : "auto", background: "var(--void)", border: "1px solid var(--line)", padding: 26 }}>
        <div className="lbl-hot" style={{ marginBottom: 6 }}>ENTR</div>
        <div style={{ fontSize: 26, letterSpacing: ".2em", marginBottom: 26 }}>CIPHER</div>
        <form onSubmit={enter} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>EMAIL</div>
            <input className="fld" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>PASSWORD</div>
            <input className="fld" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          {err && <div style={{ fontSize: 10, letterSpacing: ".06em", color: "var(--hot)", lineHeight: 1.7 }}>{err}</div>}
          {unconfirmed && (
            <button type="button" className="btn" onClick={resend} disabled={busy}>RESEND THE LINK</button>
          )}
          {note && <div className="lbl" style={{ color: "var(--bone)" }}>{note}</div>}
          <button className="btn btn-hot" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>
        <div className="lbl-faint" style={{ marginTop: 22, fontSize: 9 }}>
          No account yet? <Link href="/signup" style={{ color: "var(--hot)" }}>ENROL</Link> with your team code
        </div>
      </div>
    </main>
  );
}

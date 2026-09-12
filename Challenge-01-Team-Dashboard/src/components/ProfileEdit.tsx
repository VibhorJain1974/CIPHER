"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DIVISION_LIST } from "@/lib/types";

/**
 * A member edits their own file. Department is here because it decides their
 * division, and the links are here because a dossier without a way to reach
 * the person is half a dossier.
 *
 * The URL/email shapes are enforced by a database constraint, not just by
 * this form, so a hand-crafted request cannot put a javascript: link on a
 * page teammates are going to click.
 *
 * The trigger is deliberately tiny, and the form itself opens as a popup
 * rather than an inline block — editing your file should not shove the rest
 * of the dossier down every time someone opens it.
 */
export default function ProfileEdit({
  id, department, github, linkedin, phone, contactEmail, onSaved,
}: {
  id: string; department: string;
  github: string | null; linkedin: string | null; phone: string | null;
  contactEmail: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState(department ?? "");
  const [gh, setGh] = useState(github ?? "");
  const [li, setLi] = useState(linkedin ?? "");
  const [ph, setPh] = useState(phone ?? "");
  const [em, setEm] = useState(contactEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function save() {
    setBusy(true); setErr(""); setOk(false);
    const clean = (v: string) => (v.trim() === "" ? null : v.trim());
    const { error } = await createClient().from("profiles").update({
      department: dept.trim(),
      github_url: clean(gh),
      linkedin_url: clean(li),
      phone: clean(ph),
      contact_email: clean(em),
    }).eq("id", id);
    setBusy(false);
    if (error) {
      setErr(error.message.includes("shape")
        ? "A FIELD IS THE WRONG SHAPE. GITHUB MUST START https://github.com/, LINKEDIN https://linkedin.com/, EMAIL MUST LOOK LIKE AN EMAIL"
        : error.message.toUpperCase());
      return;
    }
    setOk(true); onSaved();
    setTimeout(() => setOk(false), 2400);
  }

  if (!open) {
    return (
      <button className="btn-mini" onClick={() => setOpen(true)}>+ ADD LINKS</button>
    );
  }

  return (
    <div className="modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="modal-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <span className="lbl-hot">EDIT FILE</span>
          <span className="lbl-faint" style={{ fontSize: 8 }}>ONLY YOU CAN EDIT YOURS</span>
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>DEPARTMENT <span style={{ color: "var(--faint)" }}>· SETS YOUR DIVISION</span></div>
          <input className="fld" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="TECH / DESIGN / PR" />
          <div className="lbl-faint" style={{ fontSize: 8, marginTop: 6, lineHeight: 1.8 }}>
            {DIVISION_LIST.map((d) => `${d.code} ${d.name}`).join(" · ")}
          </div>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>GITHUB <span style={{ color: "var(--faint)" }}>· OPTIONAL</span></div>
            <input className="fld" value={gh} onChange={(e) => setGh(e.target.value)} placeholder="https://github.com/you" />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>LINKEDIN <span style={{ color: "var(--faint)" }}>· OPTIONAL</span></div>
            <input className="fld" value={li} onChange={(e) => setLi(e.target.value)} placeholder="https://linkedin.com/in/you" />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>NUMBER <span style={{ color: "var(--faint)" }}>· CALL / WHATSAPP</span></div>
            <input className="fld" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="+91…" />
          </label>
          <label>
            <div className="lbl" style={{ marginBottom: 6 }}>EMAIL <span style={{ color: "var(--faint)" }}>· OPTIONAL</span></div>
            <input className="fld" value={em} onChange={(e) => setEm(e.target.value)} placeholder="you@gmail.com" />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-hot" disabled={busy} onClick={save}>{busy ? "SAVING…" : "SAVE"}</button>
          <button className="btn" onClick={() => setOpen(false)}>CLOSE</button>
          {ok && <span className="lbl" style={{ color: "var(--bone)" }}>SAVED</span>}
          {err && <span className="lbl" style={{ color: "var(--hot)", lineHeight: 1.7 }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}

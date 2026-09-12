"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { divisionOf } from "@/lib/types";

interface Msg { id: number; member_id: string; body: string; created_at: string }
interface Who { full_name: string; department: string }

/**
 * Team channel. Sealed like everything else: only enrolled nodes can read it
 * and only the author can post as themselves, both enforced by policy rather
 * than by the UI.
 *
 * Reads are re-run on open as well as on mount, and the realtime feed is
 * treated as an optimisation rather than the source of truth, because a
 * dropped socket must never look like an empty channel.
 */
export default function Chat({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [who, setWho] = useState<Record<string, Who>>({});
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  const load = useCallback(async () => {
    const sb = createClient();
    const [{ data: m, error: me }, { data: p }] = await Promise.all([
      sb.from("chat").select("*").order("id", { ascending: true }).limit(200),
      sb.from("profiles").select("id, full_name, department"),
    ]);
    if (me) { setErr(me.message.toUpperCase()); setLoaded(true); return; }
    setErr("");
    setMsgs((m as Msg[]) ?? []);
    const map: Record<string, Who> = {};
    (p ?? []).forEach((r) => {
      map[r.id as string] = { full_name: r.full_name as string, department: r.department as string };
    });
    setWho(map);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const sb = createClient();
    const ch = sb.channel("team-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat" }, (payload) => {
        const row = payload.new as Msg;
        setMsgs((r) => (r.some((x) => x.id === row.id) ? r : [...r, row]).slice(-200));
        if (!openRef.current && row.member_id !== userId) setUnread((n) => n + 1);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [load, userId]);

  // reopening always re-reads, so a dropped socket cannot strand the channel
  useEffect(() => {
    if (!open) return;
    setUnread(0);
    load();
  }, [open, load]);

  useEffect(() => {
    if (open) feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [open, msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const { data, error } = await createClient()
      .from("chat").insert({ member_id: userId, body }).select().single();
    setBusy(false);
    if (error) { setErr(error.message.toUpperCase()); return; }
    setErr("");
    setText("");
    // show it immediately rather than waiting on the socket to echo it back
    if (data) setMsgs((r) => (r.some((x) => x.id === (data as Msg).id) ? r : [...r, data as Msg]));
  }

  return (
    <>
      {!open && (
        <button className="chat-tab" onClick={() => setOpen(true)}>
          CHANNEL
          {unread > 0 && <span className="chat-dot">{unread > 9 ? "9+" : unread}</span>}
        </button>
      )}

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <span className="lbl-hot" style={{ fontSize: 9 }}>CHANNEL // CIPHER</span>
            <button className="chat-x" onClick={() => setOpen(false)} aria-label="close channel">×</button>
          </div>

          {err && (
            <div style={{ padding: "9px 13px", borderBottom: "1px solid var(--line-2)" }}>
              <span className="lbl" style={{ color: "var(--hot)", fontSize: 8 }}>{err}</span>
            </div>
          )}

          <div className="chat-feed" ref={feed}>
            {!loaded ? (
              <div className="sig-empty">OPENING CHANNEL…</div>
            ) : msgs.length === 0 ? (
              <div className="sig-empty">CHANNEL IS QUIET<span className="caret">_</span></div>
            ) : msgs.map((m) => {
              const w = who[m.member_id];
              const div = divisionOf(w?.department);
              const mine = m.member_id === userId;
              return (
                <div key={m.id} className={`chat-msg${mine ? " mine" : ""}`}>
                  <div className="chat-meta">
                    <span style={{ color: div.col }}>{div.glyph}</span>
                    <span className="chat-who">{(w?.full_name ?? "NODE").toUpperCase()}</span>
                    <span className="chat-time">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="chat-body">{m.body}</div>
                </div>
              );
            })}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input className="fld" value={text} maxLength={500} placeholder="TRANSMIT…"
              onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-hot" type="submit" disabled={busy || !text.trim()}>SEND</button>
          </form>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { divisionOf } from "@/lib/types";

interface Msg { id: number; member_id: string; body: string; created_at: string }
interface Who { full_name: string; department: string }

/**
 * Team channel. Sealed like everything else: only enrolled nodes can read it
 * and only the author can post as themselves, both enforced by policy rather
 * than by the UI. Live over realtime, so it behaves like a chat and not like
 * a comment box.
 */
export default function Chat({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [who, setWho] = useState<Record<string, Who>>({});
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const [{ data: m }, { data: p }] = await Promise.all([
        sb.from("chat").select("*").order("created_at", { ascending: false }).limit(60),
        sb.from("profiles").select("id, full_name, department"),
      ]);
      setMsgs(((m as Msg[]) ?? []).reverse());
      const map: Record<string, Who> = {};
      (p ?? []).forEach((r) => {
        map[r.id as string] = { full_name: r.full_name as string, department: r.department as string };
      });
      setWho(map);
    })();

    const ch = sb.channel("team-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat" }, (payload) => {
        const row = payload.new as Msg;
        setMsgs((r) => [...r, row].slice(-120));
        if (!openRef.current && row.member_id !== userId) setUnread((n) => n + 1);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    if (open) { setUnread(0); feed.current?.scrollTo({ top: feed.current.scrollHeight }); }
  }, [open, msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const { error } = await createClient().from("chat").insert({ member_id: userId, body });
    setBusy(false);
    if (!error) setText("");
  }

  return (
    <>
      <button className="chat-tab" onClick={() => setOpen((o) => !o)}>
        {open ? "CLOSE" : "CHANNEL"}
        {!open && unread > 0 && <span className="chat-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <span className="lbl-hot" style={{ fontSize: 9 }}>CHANNEL // CIPHER</span>
            <span className="lbl-faint" style={{ fontSize: 8 }}>SEALED · CREW ONLY</span>
          </div>

          <div className="chat-feed" ref={feed}>
            {msgs.length === 0 ? (
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

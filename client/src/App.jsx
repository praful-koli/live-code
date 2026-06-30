import { useEffect, useRef, useState } from "react";
import { Glass } from "@samasante/liquid-glass";
import socket from "./socket";

const API = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/v1/rooms`
  : "http://localhost:3000/api/v1/rooms";

const App = () => {
  const [tab, setTab] = useState("join");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingUsers, setEditingUsers] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  const textareaRef = useRef(null);
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const typingTimer = useRef(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { versionRef.current = version; }, [version]);

  const log = (msg) => setLogs((p) => [...p.slice(-39), { id: Math.random(), text: msg, time: new Date().toLocaleTimeString() }]);

  useEffect(() => {
    const c = localStorage.getItem("cr_code"), n = localStorage.getItem("cr_name"),
      p = localStorage.getItem("cr_pid"), h = localStorage.getItem("cr_host") === "true";
    if (c && n && p) { setRoomCode(c); setDisplayName(n); setParticipantId(p); setIsHost(h); joinSession(c, p, n); }
  }, []);

  useEffect(() => {
    const onConnect = () => { setConnected(true); log("Connected to server"); };
    const onDisconnect = (r) => { setConnected(false); log(`Disconnected: ${r}`); };
    const onParticipants = (list) => setParticipants(list || []);
    const onJoined = (p) => log(p.message || `${p.name} joined the room`);
    const onLeft = (p) => log(p.message || `${p.name} left the room`);
    const onTyping = ({ participant }) => setTypingUsers((prev) => [...new Set([...prev, participant.name])]);
    const onStopTyping = ({ participant }) => setTypingUsers((prev) => prev.filter((n) => n !== participant.name));
    const onDocLoad = ({ content: c, version: v }) => { setContent(c); setVersion(v); log(`Synchronized document (v${v})`); };
    const onDocAck = ({ version: v }) => setVersion(v);
    const onDocDelta = ({ delta, version: v }) => {
      const old = contentRef.current, cursor = textareaRef.current?.selectionStart || 0;
      let next = old;
      if (delta.type === "insert") next = old.slice(0, delta.position) + delta.text + old.slice(delta.position);
      else if (delta.type === "delete") next = old.slice(0, delta.position) + old.slice(delta.position + (delta.text?.length || 1));
      setContent(next); setVersion(v);
      let adj = cursor;
      if (delta.type === "insert" && delta.position <= cursor) adj += delta.text.length;
      else if (delta.type === "delete" && delta.position < cursor) adj = Math.max(delta.position, cursor - (delta.text?.length || 1));
      setTimeout(() => { if (textareaRef.current) { textareaRef.current.selectionStart = adj; textareaRef.current.selectionEnd = adj; } }, 0);
    };
    const onDocSync = ({ content: c, version: v }) => { setContent(c); setVersion(v); };
    const onCursor = ({ cursor }) => { if (cursor?.participantId) setEditingUsers((p) => ({ ...p, [cursor.participantId]: { name: cursor.participantName, pos: cursor.position, t: Date.now() } })); };
    const onErr = (e) => log(`Error: ${e.message}`);

    socket.on("connect", onConnect); socket.on("disconnect", onDisconnect);
    socket.on("participant:list", onParticipants); socket.on("participant:joined", onJoined);
    socket.on("participant:left", onLeft); socket.on("presence:typing", onTyping);
    socket.on("presence:stop-typing", onStopTyping); socket.on("doc:load", onDocLoad);
    socket.on("doc:ack", onDocAck); socket.on("doc:delta", onDocDelta);
    socket.on("doc:sync", onDocSync); socket.on("doc:cursor", onCursor);
    socket.on("socket:error", onErr);

    const ci = setInterval(() => {
      setEditingUsers((p) => { const n = { ...p }; let c = false; for (const [id, u] of Object.entries(n)) if (Date.now() - u.t > 10000) { delete n[id]; c = true; } return c ? n : p; });
    }, 5000);

    return () => {
      ["connect", "disconnect", "participant:list", "participant:joined", "participant:left",
       "presence:typing", "presence:stop-typing", "doc:load", "doc:ack", "doc:delta", "doc:sync", "doc:cursor", "socket:error"
      ].forEach((e) => socket.removeAllListeners(e));
      clearInterval(ci);
    };
  }, []);

  const joinSession = (code, pid, name) => {
    if (!socket.connected) socket.connect();
    socket.emit("room:join", { roomCode: code.toUpperCase(), participantId: pid });
    socket.emit("doc:load", { roomCode: code.toUpperCase() });
    fetch(`${API}/${code}`, { credentials: "include" }).then(r => r.json()).then(d => { if (d.success) setIsLocked(d.data?.isLocked || false); }).catch(() => {});
    setJoined(true); log(`Session initialized for ${name}`);
  };

  const save = (c, n, p, h) => { localStorage.setItem("cr_code", c); localStorage.setItem("cr_name", n); localStorage.setItem("cr_pid", p); localStorage.setItem("cr_host", String(h)); };
  const clear = () => { ["cr_code", "cr_name", "cr_pid", "cr_host"].forEach((k) => localStorage.removeItem(k)); };

  const handleCreate = async () => {
    if (!roomName.trim() || !displayName.trim()) return setStatusMessage("Fill in all fields");
    try {
      setStatusMessage("Initializing workspace...");
      const r = await (await fetch(`${API}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomName: roomName.trim(), hostName: displayName.trim() }) })).json();
      if (!r.success) throw new Error(r.message);
      setRoomCode(r.data.room.roomCode); setParticipantId(r.data.participant._id); setIsHost(true);
      save(r.data.room.roomCode, r.data.participant.name, r.data.participant._id, true);
      joinSession(r.data.room.roomCode, r.data.participant._id, r.data.participant.name); setStatusMessage("");
    } catch (e) { setStatusMessage(e.message); }
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !displayName.trim()) return setStatusMessage("Fill in all fields");
    try {
      setStatusMessage("Connecting to workspace...");
      const r = await (await fetch(`${API}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase(), name: displayName.trim() }) })).json();
      if (!r.success) throw new Error(r.message);
      setParticipantId(r.data.participant._id); setIsHost(false);
      save(r.data.room.roomCode, r.data.participant.name, r.data.participant._id, false);
      joinSession(r.data.room.roomCode, r.data.participant._id, r.data.participant.name); setStatusMessage("");
    } catch (e) { setStatusMessage(e.message); }
  };

  const handleLeave = () => {
    socket.emit("room:leave"); socket.disconnect(); clear();
    setJoined(false); setIsHost(false); setParticipants([]); setTypingUsers([]);
    setEditingUsers({}); setContent(""); setVersion(0); setStatusMessage(""); log("Left workspace");
  };

  const handleEdit = (e) => {
    const nv = e.target.value, ov = contentRef.current;
    setContent(nv);
    if (!joined) return;
    socket.emit("presence:typing", { roomCode: roomCode.toUpperCase(), participant: { name: displayName, id: participantId } });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("presence:stop-typing", { roomCode: roomCode.toUpperCase(), participant: { name: displayName, id: participantId } }), 1500);
    let s = 0;
    while (s < ov.length && s < nv.length && ov[s] === nv[s]) s++;
    let eo = ov.length, en = nv.length;
    while (eo > s && en > s && ov[eo - 1] === nv[en - 1]) { eo--; en--; }
    let delta = null;
    if (nv.length > ov.length) delta = { type: "insert", position: s, text: nv.slice(s, en), version: versionRef.current, participantId, participantName: displayName };
    else if (nv.length < ov.length) delta = { type: "delete", position: s, text: ov.slice(s, eo), version: versionRef.current, participantId, participantName: displayName };
    if (delta) socket.emit("doc:delta", { roomCode: roomCode.toUpperCase(), delta });
  };

  const handleSelect = (e) => {
    if (!joined) return;
    socket.emit("doc:cursor", { roomCode: roomCode.toUpperCase(), cursor: { participantId, participantName: displayName, position: e.target.selectionStart } });
  };

  const hostAct = async (url, method = "PATCH", body) => {
    try {
      const o = { method, credentials: "include" };
      if (body) { o.headers = { "Content-Type": "application/json" }; o.body = JSON.stringify(body); }
      const r = await (await fetch(url, o)).json();
      if (!r.success) throw new Error(r.message); return r;
    } catch (e) { alert(e.message); return null; }
  };

  const GlassCard = ({ children, style = {} }) => (
    <Glass
      style={{ borderRadius: 24, background: "rgba(20, 22, 28, 0.45)", ...style }}
      optics={{ frost: 2.5, dispersion: 0.3 }}
    >
      <div style={{ padding: 28, borderRadius: 24, background: "rgba(24, 26, 32, 0.72)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(28px) saturate(1.4)" }}>
        {children}
      </div>
    </Glass>
  );

  return (
    <div style={{ minHeight: "100vh", padding: 28 }}>
      <div style={{ maxWidth: 1520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Domain B: Sync Engine</p>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", marginTop: 2 }}>CodeRoom</h1>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className={`chip ${connected ? "success" : "danger"}`}>
                <span className="dot" />{connected ? "Server Online" : "Connecting..."}
              </span>
              {joined && <span className="chip" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", background: "rgba(255,255,255,0.08)" }}>{roomCode.toUpperCase()}</span>}
            </div>
          </div>
        </GlassCard>

        {!joined ? (
          /* ─── LANDING PAGE ─── */
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 380px" }}>
            <GlassCard>
              <div className="tab-group" style={{ marginBottom: 32 }}>
                <button className={`tab-btn ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>Join Workspace</button>
                <button className={`tab-btn ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>Provision Room</button>
              </div>

              {tab === "join" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Access active session</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Join collaboration by inserting the room token below.</p>
                  </div>
                  <div><label className="field-label">Room Token</label><input className="input-field mono" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="ABC123" /></div>
                  <div><label className="field-label">Display Nickname</label><input className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Username" /></div>
                  <button className="btn-primary" onClick={handleJoin}>Join Session</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Create new room</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Generate a fresh document workspace on MongoDB Cluster.</p>
                  </div>
                  <div><label className="field-label">Workspace Identifier</label><input className="input-field" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="CodeRoom Alpha" /></div>
                  <div><label className="field-label">Host Nickname</label><input className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Administrator" /></div>
                  <button className="btn-primary" onClick={handleCreate}>Provision Workspace</button>
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>System Architecture</h3>
              {[
                ["OT-Lite Sync Engine", "Server-side delta adjustment adjusts offset drift dynamically."],
                ["Structured Persistency", "Rooms, log configurations, and states live in MongoDB Atlas."],
                ["Bi-directional Sockets", "Broadcasts events, active typing lists, and user focus markers."],
                ["Host Privilege Layer", "Supports locked entrances, room destruction, and kicks."],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginTop: 7, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 3 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        ) : (
          /* ─── APP WORKSPACE ─── */
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "330px 1fr" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Session parameters */}
              <GlassCard>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Token</p>
                    <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", letterSpacing: "0.04em" }}>{roomCode.toUpperCase()}</p>
                  </div>
                  <button className="btn-secondary" onClick={handleLeave}>Disconnect</button>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Session Role</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{displayName}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: isHost ? "rgba(139, 164, 185, 0.15)" : "rgba(255,255,255,0.04)", color: isHost ? "var(--accent)" : "var(--text-secondary)", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.05)" }}>{isHost ? "Host" : "Member"}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Host Privilege Deck */}
              {isHost && (
                <GlassCard>
                  <p className="field-label" style={{ marginBottom: 14 }}>Privilege actions</p>
                  <div className="host-grid">
                    <button className="host-btn" onClick={async () => { const n = prompt("New room name:"); if (n) { await hostAct(`${API}/${roomCode.toUpperCase()}/rename`, "PATCH", { roomName: n.trim() }); log(`Room renamed to ${n.trim()}`); } }}>Rename</button>
                    {isLocked
                      ? <button className="host-btn safe" onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/unlock`)) { setIsLocked(false); log("Entrance unlocked"); } }}>Unlock</button>
                      : <button className="host-btn warn" onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/lock`)) { setIsLocked(true); log("Entrance locked"); } }}>Lock</button>}
                  </div>
                  <button className="btn-danger" style={{ width: "100%", marginTop: 8 }} onClick={async () => { if (confirm("De-provision workspace for everyone?") && await hostAct(`${API}/${roomCode.toUpperCase()}/delete`, "DELETE")) handleLeave(); }}>Terminate Room</button>
                </GlassCard>
              )}

              {/* Active Participants */}
              <GlassCard>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p className="field-label" style={{ margin: 0 }}>Workspace Roster</p>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.06)" }}>{participants.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {participants.map((p) => (
                    <div key={p._id} className="participant-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.isOnline ? "var(--success)" : "var(--text-tertiary)" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</span>
                        {p.isHost && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)" }}>H</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {typingUsers.includes(p.name) && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)" }}>typing</span>}
                        {editingUsers[p._id] && <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>@{editingUsers[p._id].pos}</span>}
                        {isHost && !p.isHost && <button className="kick-btn" onClick={() => { if (confirm(`Remove ${p.name} from session?`)) hostAct(`${API}/${roomCode.toUpperCase()}/participants/${p._id}`, "DELETE"); }}>✕</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Runtime activity log */}
              <GlassCard>
                <p className="field-label" style={{ marginBottom: 14 }}>Workspace Logger</p>
                <div style={{ maxHeight: 130, overflowY: "auto" }}>
                  {logs.length === 0 ? <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No entries recorded.</p> : logs.map((l) => (
                    <div key={l.id} className="log-entry" style={{ marginBottom: 8 }}><span className="log-time">{l.time}</span><span className="log-text">{l.text}</span></div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Document Editor */}
            <GlassCard style={{ minHeight: 740 }}>
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Active Document Buffer</p>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginTop: 3 }}>Workspace Editor</h2>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span className="chip" style={{ fontFamily: "'JetBrains Mono', monospace" }}>v{version}</span>
                    <span className="chip" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{content.length} chars</span>
                  </div>
                </div>
                <div style={{ flex: 1, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(0,0,0,0.35)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shared Pane</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--success)" }}>● Synchronized</span>
                  </div>
                  <textarea ref={textareaRef} className="editor-textarea" value={content} onChange={handleEdit} onSelect={handleSelect} onKeyUp={handleSelect} placeholder="// Enter code, configuration, or documentation..." style={{ flex: 1 }} />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {statusMessage && <div className="toast">{statusMessage}</div>}
      </div>
    </div>
  );
};

export default App;

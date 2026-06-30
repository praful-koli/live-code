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

  // Custom Optics
  const [gridEnabled, setGridEnabled] = useState(true);
  const [frostLevel, setFrostLevel] = useState(2.0);
  const [dispersion, setDispersion] = useState(0.25);

  const textareaRef = useRef(null);
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const typingTimer = useRef(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { versionRef.current = version; }, [version]);

  const log = (msg) => setLogs((p) => [...p.slice(-15), { id: Math.random(), text: msg, time: new Date().toLocaleTimeString() }]);

  useEffect(() => {
    const c = localStorage.getItem("cr_code"), n = localStorage.getItem("cr_name"),
      p = localStorage.getItem("cr_pid"), h = localStorage.getItem("cr_host") === "true";
    if (c && n && p) { setRoomCode(c); setDisplayName(n); setParticipantId(p); setIsHost(h); joinSession(c, p, n); }
  }, []);

  useEffect(() => {
    const onConnect = () => { setConnected(true); log("Connected to server"); };
    const onDisconnect = (r) => { setConnected(false); log(`Disconnected: ${r}`); };
    const onParticipants = (list) => setParticipants(list || []);
    const onJoined = (p) => log(`${p.name} joined`);
    const onLeft = (p) => log(`${p.name} left`);
    const onTyping = ({ participant }) => setTypingUsers((prev) => [...new Set([...prev, participant.name])]);
    const onStopTyping = ({ participant }) => setTypingUsers((prev) => prev.filter((n) => n !== participant.name));
    const onDocLoad = ({ content: c, version: v }) => { setContent(c); setVersion(v); log(`Loaded document (v${v})`); };
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
    setJoined(true); log("Joined session");
  };

  const save = (c, n, p, h) => { localStorage.setItem("cr_code", c); localStorage.setItem("cr_name", n); localStorage.setItem("cr_pid", p); localStorage.setItem("cr_host", String(h)); };
  const clear = () => { ["cr_code", "cr_name", "cr_pid", "cr_host"].forEach((k) => localStorage.removeItem(k)); };

  const handleCreate = async () => {
    if (!roomName.trim() || !displayName.trim()) return setStatusMessage("Required fields are empty");
    try {
      setStatusMessage("Provisioning...");
      const r = await (await fetch(`${API}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomName: roomName.trim(), hostName: displayName.trim() }) })).json();
      if (!r.success) throw new Error(r.message);
      setRoomCode(r.data.room.roomCode); setParticipantId(r.data.participant._id); setIsHost(true);
      save(r.data.room.roomCode, r.data.participant.name, r.data.participant._id, true);
      joinSession(r.data.room.roomCode, r.data.participant._id, r.data.participant.name); setStatusMessage("");
    } catch (e) { setStatusMessage(e.message); }
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !displayName.trim()) return setStatusMessage("Required fields are empty");
    try {
      setStatusMessage("Connecting...");
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
    setEditingUsers({}); setContent(""); setVersion(0); setStatusMessage(""); log("Disconnected");
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

  // Base Minimalist Glass Panel
  const GlassPanel = ({ children, style = {} }) => (
    <Glass
      style={{ borderRadius: 20, background: "rgba(20, 22, 26, 0.45)", ...style }}
      optics={{ frost: frostLevel, dispersion: dispersion }}
    >
      <div style={{ padding: 24, borderRadius: 20, background: "rgba(24, 26, 32, 0.72)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(24px)" }}>
        {children}
      </div>
    </Glass>
  );

  // Aave Switch component
  const AaveSwitch = ({ checked, onChange }) => {
    const pos = checked ? "calc(100% - 22px)" : "2px";
    return (
      <div onClick={() => onChange(!checked)} style={{ position: "relative", width: 48, height: 26, borderRadius: 13, background: checked ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
        <Glass style={{ position: "absolute", top: 2, left: pos, width: 20, height: 20, borderRadius: 10, background: checked ? "#f3f4f6" : "rgba(255,255,255,0.35)", transition: "left 0.2s ease" }} optics={{ frost: 1, dispersion: 0.1 }}>
          <div style={{ width: "100%", height: "100%" }} />
        </Glass>
      </div>
    );
  };

  // Aave Slider component
  const AaveSlider = ({ min, max, step, value, onChange }) => {
    const pct = ((value - min) / (max - min)) * 100;
    const handleMouseDown = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const update = (clientX) => {
        const pctPos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const val = min + pctPos * (max - min);
        onChange(Math.round(val / step) * step);
      };
      update(e.clientX);
      const onMove = (me) => update(me.clientX);
      const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
      document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
    };
    return (
      <div onMouseDown={handleMouseDown} style={{ position: "relative", height: 32, display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(0,0,0,0.5)", position: "relative" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
        </div>
        <Glass style={{ position: "absolute", left: `calc(${pct}% - 12px)`, width: 24, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.15)" }} optics={{ frost: 1.5, dispersion: 0.1 }}>
          <div style={{ width: "100%", height: "100%" }} />
        </Glass>
      </div>
    );
  };

  // Aave Toggle Group
  const AaveToggleGroup = ({ active, options, onChange }) => {
    const idx = options.findIndex(o => o.value === active);
    const w = 100 / options.length;
    return (
      <div style={{ position: "relative", display: "flex", padding: 3, borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <Glass style={{ position: "absolute", top: 3, bottom: 3, left: `calc(${idx * w}% + 3px)`, width: `calc(${w}% - 6px)`, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", transition: "left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", zIndex: 1 }} optics={{ frost: 2, dispersion: 0.15 }}>
          <div style={{ width: "100%", height: "100%" }} />
        </Glass>
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ position: "relative", flex: 1, padding: "10px 12px", borderRadius: 9, border: "none", background: "transparent", color: active === opt.value ? "#f3f4f6" : "#8e939e", fontSize: 13, fontWeight: active === opt.value ? 600 : 500, cursor: "pointer", zIndex: 2 }}>{opt.label}</button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <style>{`
        body { background-image: ${gridEnabled ? "linear-gradient(to right, rgba(255, 255, 255, 0.012) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.012) 1px, transparent 1px)" : "none"}; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Minimal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Glass style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.1)", display: "inline-block" }} optics={{ frost: 2, dispersion: 0.2 }}>
              <div style={{ width: "100%", height: "100%" }} />
            </Glass>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>CodeRoom</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: connected ? "var(--success)" : "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "var(--success)" : "var(--danger)" }} />
            {connected ? "LIVE" : "DISCONNECTED"}
          </span>
        </div>

        {!joined ? (
          /* ─── LANDING SCREEN (No extra text, clean form) ─── */
          <div style={{ maxWidth: 460, margin: "60px auto 0 auto", width: "100%" }}>
            <GlassPanel>
              <AaveToggleGroup active={tab} options={[{ label: "Join Room", value: "join" }, { label: "Create Room", value: "create" }]} onChange={setTab} />
              <div style={{ height: 24 }} />

              {tab === "join" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div><label className="field-label">Room Token</label><input className="input-minimal mono" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="TOKEN" /></div>
                  <div><label className="field-label">Nickname</label><input className="input-minimal" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" /></div>
                  <button className="btn-action" onClick={handleJoin}>Join Session</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div><label className="field-label">Workspace Identifier</label><input className="input-minimal" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Workspace Name" /></div>
                  <div><label className="field-label">Host Nickname</label><input className="input-minimal" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Host Name" /></div>
                  <button className="btn-action" onClick={handleCreate}>Provision Room</button>
                </div>
              )}
            </GlassPanel>
            
            {/* Clean Config Panel underneath */}
            <div style={{ height: 16 }} />
            <GlassPanel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Refraction grid overlay</span>
                <AaveSwitch checked={gridEnabled} onChange={setGridEnabled} />
              </div>
            </GlassPanel>
          </div>
        ) : (
          /* ─── MINIMAL EDITOR WORKSPACE ─── */
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "280px 1fr" }}>
            
            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Session details */}
              <GlassPanel>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em" }}>ROOM TOKEN</span>
                    <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.04em", marginTop: 2 }}>{roomCode.toUpperCase()}</p>
                  </div>
                  <button className="btn-secondary-min" onClick={handleLeave}>Leave</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 8, padding: "8px 12px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: isHost ? "var(--accent-soft)" : "rgba(255,255,255,0.04)", color: isHost ? "var(--accent)" : "var(--text-muted)", border: "1px solid rgba(255,255,255,0.04)" }}>{isHost ? "HOST" : "MEMBER"}</span>
                </div>
              </GlassPanel>

              {/* Host Controls */}
              {isHost && (
                <GlassPanel>
                  <span className="field-label" style={{ marginBottom: 12 }}>Room Actions</span>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button style={{ flex: 1 }} className="btn-secondary-min" onClick={async () => { const n = prompt("Rename room:"); if (n) { await hostAct(`${API}/${roomCode.toUpperCase()}/rename`, "PATCH", { roomName: n.trim() }); log("Room renamed"); } }}>Rename</button>
                    {isLocked
                      ? <button className="btn-secondary-min" style={{ color: "var(--success)", borderColor: "rgba(82, 168, 116, 0.2)" }} onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/unlock`)) { setIsLocked(false); log("Unlocked"); } }}>Unlock</button>
                      : <button className="btn-secondary-min" style={{ color: "var(--warning)", borderColor: "rgba(224, 159, 83, 0.2)" }} onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/lock`)) { setIsLocked(true); log("Locked"); } }}>Lock</button>}
                  </div>
                  <button className="btn-secondary-min" style={{ width: "100%", color: "var(--danger)", borderColor: "rgba(217, 95, 95, 0.2)" }} onClick={async () => { if (confirm("Close room for everyone?") && await hostAct(`${API}/${roomCode.toUpperCase()}/delete`, "DELETE")) handleLeave(); }}>Terminate Room</button>
                </GlassPanel>
              )}

              {/* Active Participants */}
              <GlassPanel>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span className="field-label" style={{ margin: 0 }}>Roster</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>{participants.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {participants.map((p) => (
                    <div key={p._id} className="participant-item">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.isOnline ? "var(--success)" : "var(--text-muted)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                        {p.isHost && <span style={{ fontSize: 8, fontWeight: 700, color: "var(--accent)" }}>[H]</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {typingUsers.includes(p.name) && <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>typing</span>}
                        {editingUsers[p._id] && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>@{editingUsers[p._id].pos}</span>}
                        {isHost && !p.isHost && <button className="kick-btn-min" onClick={() => { if (confirm(`Remove ${p.name}?`)) hostAct(`${API}/${roomCode.toUpperCase()}/participants/${p._id}`, "DELETE"); }}>✕</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Glass settings customizer */}
              <GlassPanel>
                <span className="field-label" style={{ marginBottom: 12 }}>Aesthetics</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Grid Overlay</span>
                  <AaveSwitch checked={gridEnabled} onChange={setGridEnabled} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "var(--text-muted)" }}>Frost Level</span><span style={{ fontSize: 10, fontFamily: "monospace" }}>{frostLevel.toFixed(1)}px</span></div>
                  <AaveSlider min={1.0} max={5.0} step={0.1} value={frostLevel} onChange={setFrostLevel} />
                </div>
              </GlassPanel>
            </div>

            {/* Document Editor */}
            <GlassPanel style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em" }}>SHARED DOCUMENT</span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>Workspace Editor</h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontFamily: "monospace" }}>v{version}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontFamily: "monospace" }}>{content.length} chars</span>
                </div>
              </div>
              <div style={{ flex: 1, borderRadius: 12, border: "1px solid var(--border)", background: "rgba(0,0,0,0.4)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <textarea ref={textareaRef} className="editor-pane" value={content} onChange={handleEdit} onSelect={handleSelect} onKeyUp={handleSelect} placeholder="// Type your shared buffer content here..." style={{ minHeight: "560px" }} />
              </div>
            </GlassPanel>
          </div>
        )}

        {statusMessage && <div className="toast-minimal">{statusMessage}</div>}
      </div>
    </div>
  );
};

export default App;

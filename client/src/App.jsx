import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import socket from "./socket";

const API = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/v1/rooms`
  : "http://localhost:3000/api/v1/rooms";

const App = () => {
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("join");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hostKey, setHostKey] = useState("");
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

  // Custom Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: "alert", // "alert" | "confirm" | "prompt"
    title: "",
    message: "",
    value: "",
    onConfirm: null,
    onCancel: null
  });

  const tabContentRef = useRef(null);
  const sliderIndicatorRef = useRef(null);
  const textareaRef = useRef(null);
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const typingTimer = useRef(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { versionRef.current = version; }, [version]);

  const log = (msg) => setLogs((p) => [...p.slice(-12), { id: Math.random(), text: msg, time: new Date().toLocaleTimeString() }]);

  // Light / Dark Mode Toggle handler
  useEffect(() => {
    document.body.className = theme === "light" ? "light-theme" : "";
  }, [theme]);

  // Entrance animations for panels
  useEffect(() => {
    if (joined) {
      gsap.fromTo(".workspace-panel", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7, ease: "power4.out", stagger: 0.1 }
      );
    } else {
      gsap.fromTo(".landing-form-block", 
        { x: -30, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
      // Clean, single-shot entrance animation for the visual side cards (no infinite yoyo loops)
      gsap.fromTo(".floating-card", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.12 }
      );
    }
  }, [joined]);

  // Hover animation handlers using GSAP
  const handleCardHoverIn = (e) => {
    gsap.to(e.currentTarget, { y: -8, scale: 1.04, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", duration: 0.3, ease: "power2.out" });
  };
  const handleCardHoverOut = (e) => {
    gsap.to(e.currentTarget, { y: 0, scale: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", duration: 0.3, ease: "power2.out" });
  };

  const handleDarkCardHoverIn = (e) => {
    gsap.to(e.currentTarget, { y: -8, scale: 1.04, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", duration: 0.3, ease: "power2.out" });
  };
  const handleDarkCardHoverOut = (e) => {
    gsap.to(e.currentTarget, { y: 0, scale: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", duration: 0.3, ease: "power2.out" });
  };

  // Custom Modal helper functions to replace browser native popups
  const triggerAlert = (title, message) => {
    setModal({
      isOpen: true,
      type: "alert",
      title,
      message,
      value: "",
      onConfirm: () => setModal(m => ({ ...m, isOpen: false }))
    });
  };

  const triggerConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title,
      message,
      value: "",
      onConfirm: () => {
        onConfirm();
        setModal(m => ({ ...m, isOpen: false }));
      },
      onCancel: () => setModal(m => ({ ...m, isOpen: false }))
    });
  };

  const triggerPrompt = (title, message, defaultValue = "", onConfirm) => {
    setModal({
      isOpen: true,
      type: "prompt",
      title,
      message,
      value: defaultValue,
      onConfirm: (val) => {
        onConfirm(val);
        setModal(m => ({ ...m, isOpen: false }));
      },
      onCancel: () => setModal(m => ({ ...m, isOpen: false }))
    });
  };

  // Modal GSAP Entry Transition
  useEffect(() => {
    if (modal.isOpen) {
      gsap.fromTo(".modal-content", 
        { scale: 0.9, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }
      );
    }
  }, [modal.isOpen]);

  // Version bump animation
  useEffect(() => {
    if (version > 0) {
      gsap.fromTo(".version-chip", 
        { scale: 1.25, backgroundColor: "rgba(255,255,255,0.2)" }, 
        { scale: 1, backgroundColor: "rgba(255,255,255,0.05)", duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [version]);

  // Tab change animation
  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;
    const isCreate = nextTab === "create";
    gsap.to(sliderIndicatorRef.current, {
      left: isCreate ? "calc(50% + 1px)" : "3px",
      duration: 0.35,
      ease: "power3.inOut"
    });
    gsap.to(tabContentRef.current, {
      opacity: 0,
      y: -6,
      duration: 0.15,
      onComplete: () => {
        setTab(nextTab);
        gsap.to(tabContentRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: "power2.out"
        });
      }
    });
  };

  useEffect(() => {
    const c = localStorage.getItem("cr_code"), n = localStorage.getItem("cr_name"),
      p = localStorage.getItem("cr_pid"), h = localStorage.getItem("cr_host") === "true",
      hk = localStorage.getItem("cr_hkey") || "";
    if (c && n && p) {
      setRoomCode(c);
      setDisplayName(n);
      setParticipantId(p);
      setIsHost(h);
      if (hk) setHostKey(hk);
      joinSession(c, p, n);
    }
  }, []);

  useEffect(() => {
    const onConnect = () => { setConnected(true); log("Connected to server"); };
    const onDisconnect = (r) => { setConnected(false); log(`Disconnected: ${r}`); };
    const onParticipants = (list) => setParticipants(list || []);
    const onJoined = (p) => log(`${p.name} joined`);
    const onLeft = (p) => log(`${p.name} left`);
    const onTyping = ({ participant }) => setTypingUsers((prev) => [...new Set([...prev, participant.name])]);
    const onStopTyping = ({ participant }) => setTypingUsers((prev) => prev.filter((n) => n !== participant.name));
    const onDocLoad = ({ content: c, version: v }) => { setContent(c); setVersion(v); log(`Sync v${v}`); };
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

  // hostAct Helper (passing headers for cross-origin reliability)
  const hostAct = async (url, method = "PATCH", body) => {
    try {
      const o = {
        method,
        credentials: "include",
        headers: {
          "x-participant-id": participantId,
          "x-host-key": hostKey || localStorage.getItem("cr_hkey") || ""
        }
      };
      if (body) {
        o.headers["Content-Type"] = "application/json";
        o.body = JSON.stringify(body);
      }
      const r = await (await fetch(url, o)).json();
      if (!r.success) throw new Error(r.message);
      return r;
    } catch (e) {
      triggerAlert("Action Required", e.message);
      return null;
    }
  };

  const joinSession = (code, pid, name) => {
    const doJoin = () => {
      socket.emit("room:join", { roomCode: code.toUpperCase(), participantId: pid });
      socket.emit("doc:load", { roomCode: code.toUpperCase() });
    };

    if (!socket.connected) {
      socket.connect();
      socket.once("connect", doJoin);
    } else {
      doJoin();
    }

    fetch(`${API}/${code}`, { credentials: "include" }).then(r => r.json()).then(d => {
      if (d.success) {
        setIsLocked(d.data?.isLocked || false);
      } else {
        triggerAlert("Session Alert", d.message || "Failed to load room details.");
      }
    }).catch(() => {});
    setJoined(true); log("Session initialized");
  };

  const save = (c, n, p, h, hk) => {
    localStorage.setItem("cr_code", c);
    localStorage.setItem("cr_name", n);
    localStorage.setItem("cr_pid", p);
    localStorage.setItem("cr_host", String(h));
    if (hk) localStorage.setItem("cr_hkey", hk);
  };
  const clear = () => {
    ["cr_code", "cr_name", "cr_pid", "cr_host", "cr_hkey"].forEach((k) => localStorage.removeItem(k));
    setHostKey("");
  };

  const handleCreate = async () => {
    if (!roomName.trim() || !displayName.trim()) return setStatusMessage("Required fields are empty");
    try {
      setStatusMessage("Provisioning...");
      const r = await (await fetch(`${API}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomName: roomName.trim(), hostName: displayName.trim() }) })).json();
      if (!r.success) throw new Error(r.message);
      setRoomCode(r.data.room.roomCode); setParticipantId(r.data.participant._id); setIsHost(true); setHostKey(r.data.hostKey);
      save(r.data.room.roomCode, r.data.participant.name, r.data.participant._id, true, r.data.hostKey);
      joinSession(r.data.room.roomCode, r.data.participant._id, r.data.participant.name); setStatusMessage("");
    } catch (e) { setStatusMessage(e.message); }
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !displayName.trim()) return setStatusMessage("Required fields are empty");
    try {
      setStatusMessage("Connecting...");
      const r = await (await fetch(`${API}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase(), name: displayName.trim() }) })).json();
      if (!r.success) {
        if (r.message.includes("Host authentication required")) {
          triggerAlert("Authentication Required", "Only the validated host session can rename or terminate this room.");
        } else {
          triggerAlert("Entry Denied", r.message);
        }
        setStatusMessage("");
        return;
      }
      setParticipantId(r.data.participant._id); setIsHost(false);
      save(r.data.room.roomCode, r.data.participant.name, r.data.participant._id, false, "");
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

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      
      {!joined ? (
        /* ─── SPLITSCREEN LANDING PAGE (Linktree inspired layout) ─── */
        <div className="splitscreen-container">
          
          {/* Left Form side */}
          <div className="form-side" style={{ padding: "32px 48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg style={{ width: 22, height: 22, fill: "none", stroke: "var(--accent)", strokeWidth: 2.5 }} viewBox="0 0 24 24">
                  <path d="M16 18l6-6-6-6M8 6L2 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>CodeRoom</span>
              </div>
              <button className="theme-switch-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                {theme === "dark" ? "Light Theme" : "Dark Theme"}
              </button>
            </div>

            <div className="landing-form-block" style={{ maxWidth: 400, width: "100%", margin: "24px 0" }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>Instant Code Sandbox</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Create temporary, zero-setup collaborative rooms to instantly share code snippets, conduct live technical interviews, debug together, or whiteboard ideas in real-time.
              </p>

              {/* Tabs */}
              <div className="custom-tabs">
                <div ref={sliderIndicatorRef} className="custom-tab-active-indicator" />
                <button className={`custom-tab-btn ${tab === "join" ? "active" : ""}`} onClick={() => handleTabChange("join")}>Join Workspace</button>
                <button className={`custom-tab-btn ${tab === "create" ? "active" : ""}`} onClick={() => handleTabChange("create")}>Create Workspace</button>
              </div>

              <div style={{ height: 20 }} />

              <div ref={tabContentRef}>
                {tab === "join" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <label className="field-label">Room Token</label>
                      <input className="input-premium mono" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="ABCD" />
                    </div>
                    <div>
                      <label className="field-label">Nickname</label>
                      <input className="input-premium" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nickname" />
                    </div>
                    <button className="btn-premium" onClick={handleJoin}>Join Session</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <label className="field-label">Room Name</label>
                      <input className="input-premium" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="My Buffer" />
                    </div>
                    <div>
                      <label className="field-label">Host Nickname</label>
                      <input className="input-premium" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Host Name" />
                    </div>
                    <button className="btn-premium" onClick={handleCreate}>Create Workspace</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} CodeRoom. Built on MERN & WebSockets.
            </div>
          </div>

          {/* Right Visual side (Use cases & feature highlights) */}
          <div className="visual-side" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: 48, background: "linear-gradient(135deg, rgba(37,99,235,0.9), rgba(79,70,229,0.95))" }}>
            
            <div style={{ color: "#ffffff", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>Why CodeRoom?</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4 }}>What can you do in a temporary CodeRoom?</h3>
            </div>

            {/* Feature Card 1 */}
            <div 
              className="floating-card" 
              style={{ background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 14, padding: 18, color: "#fff" }}
              onMouseEnter={handleCardHoverIn}
              onMouseLeave={handleCardHoverOut}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, background: "rgba(255,255,255,0.2)", width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>⚡</span>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Instant Pair Programming & Debugging</h4>
                  <p style={{ fontSize: 13, opacity: 0.9, margin: "4px 0 0 0", lineHeight: 1.4 }}>Share an issue or log with a teammate in seconds. No login or repo cloning required.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div 
              className="floating-card" 
              style={{ background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 14, padding: 18, color: "#fff" }}
              onMouseEnter={handleCardHoverIn}
              onMouseLeave={handleCardHoverOut}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, background: "rgba(255,255,255,0.2)", width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</span>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Live Technical Interviews</h4>
                  <p style={{ fontSize: 13, opacity: 0.9, margin: "4px 0 0 0", lineHeight: 1.4 }}>Host coding challenges with real-time cursor tracking, user presence, and version control.</p>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div 
              className="floating-card" 
              style={{ background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 14, padding: 18, color: "#fff" }}
              onMouseEnter={handleCardHoverIn}
              onMouseLeave={handleCardHoverOut}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, background: "rgba(255,255,255,0.2)", width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>🔒</span>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Disposable Scratchpad & Controls</h4>
                  <p style={{ fontSize: 13, opacity: 0.9, margin: "4px 0 0 0", lineHeight: 1.4 }}>Host controls let you lock rooms, manage active roster, and terminate session when done.</p>
                </div>
              </div>
            </div>

          </div>

          </div>

        </div>
      ) : (
        /* ─── WORKSPACE (Main App Editor) ─── */
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Workspace Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg style={{ width: 24, height: 24, fill: "none", stroke: "var(--accent)", strokeWidth: 2 }} viewBox="0 0 24 24">
                <path d="M16 18l6-6-6-6M8 6L2 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>CodeRoom</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="theme-switch-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, color: connected ? "var(--success)" : "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "var(--success)" : "var(--danger)", display: "inline-block" }} />
                {connected ? "LIVE" : "DISCONNECTED"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "280px 1fr" }}>
            
            {/* Sidebar columns */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Session parameters */}
              <div className="panel-prem workspace-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em" }}>ROOM TOKEN</span>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.05em", marginTop: 2 }}>{roomCode.toUpperCase()}</p>
                  </div>
                  <button className="btn-secondary-prem" onClick={handleLeave}>Leave</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--panel-sunken)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: isHost ? "var(--accent-soft)" : "rgba(255,255,255,0.04)", color: isHost ? "var(--accent)" : "var(--text-muted)", border: "1px solid rgba(255,255,255,0.04)" }}>{isHost ? "HOST" : "MEMBER"}</span>
                </div>
              </div>

              {/* Host Control Deck */}
              {isHost && (
                <div className="panel-prem workspace-panel">
                  <span className="field-label" style={{ marginBottom: 12 }}>Room Controls</span>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button style={{ flex: 1 }} className="btn-secondary-prem" onClick={() => {
                      triggerPrompt("Rename Room", "Enter new workspace label:", roomName, async (newVal) => {
                        if (newVal && newVal.trim()) {
                          await hostAct(`${API}/${roomCode.toUpperCase()}/rename`, "PATCH", { roomName: newVal.trim() });
                          log("Room renamed");
                        }
                      });
                    }}>Rename</button>
                    {isLocked
                      ? <button className="btn-secondary-prem" style={{ color: "var(--success)", borderColor: "rgba(82, 168, 116, 0.2)" }} onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/unlock`)) { setIsLocked(false); log("Unlocked"); } }}>Unlock</button>
                      : <button className="btn-secondary-prem" style={{ color: "var(--warning)", borderColor: "rgba(224, 159, 83, 0.2)" }} onClick={async () => { if (await hostAct(`${API}/${roomCode.toUpperCase()}/lock`)) { setIsLocked(true); log("Locked"); } }}>Lock</button>}
                  </div>
                  <button className="btn-secondary-prem" style={{ width: "100%", color: "var(--danger)", borderColor: "rgba(217, 95, 95, 0.2)" }} onClick={() => {
                    triggerConfirm("Terminate Room", "De-provision workspace and close room for everyone?", async () => {
                      if (await hostAct(`${API}/${roomCode.toUpperCase()}/delete`, "DELETE")) {
                        handleLeave();
                      }
                    });
                  }}>Terminate Room</button>
                </div>
              )}

              {/* Participants Roster */}
              <div className="panel-prem workspace-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span className="field-label" style={{ margin: 0 }}>Active Roster</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>{participants.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                  {participants.map((p) => (
                    <div key={p._id} className="roster-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.isOnline ? "var(--success)" : "var(--text-muted)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                        {p.isHost && <span style={{ fontSize: 8, fontWeight: 700, color: "var(--accent)" }}>[H]</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {typingUsers.includes(p.name) && <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>typing</span>}
                        {isHost && !p.isHost && <button className="kick-btn-min" onClick={() => {
                          triggerConfirm("Remove Participant", `Remove ${p.name}?`, () => {
                            hostAct(`${API}/${roomCode.toUpperCase()}/participants/${p._id}`, "DELETE");
                          });
                        }}>✕</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Document Editor Area */}
            <div className="panel-prem workspace-panel" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em" }}>WORKSPACE BUFFER</span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2 }}>Shared Document Editor</h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="version-chip" style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontFamily: "monospace" }}>v{version}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontFamily: "monospace" }}>{content.length} chars</span>
                </div>
              </div>
              <div style={{ flex: 1, borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel-sunken)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <textarea ref={textareaRef} className="editor-textarea-prem" value={content} onChange={handleEdit} onSelect={handleSelect} onKeyUp={handleSelect} placeholder="// Collaborate in real-time..." style={{ minHeight: "560px" }} />
              </div>
            </div>

          </div>
        </div>
      )}

      {statusMessage && <div className="toast-prem">{statusMessage}</div>}

      {/* ─── CUSTOM PREMIUM MODAL COMPONENT (Replacing browser alert/confirm/prompt) ─── */}
      {modal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>{modal.title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>{modal.message}</p>

            {modal.type === "prompt" && (
              <div style={{ marginBottom: 20 }}>
                <input 
                  type="text" 
                  className="input-premium" 
                  value={modal.value} 
                  onChange={(e) => setModal({ ...modal, value: e.target.value })} 
                  autoFocus 
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {(modal.type === "confirm" || modal.type === "prompt") && (
                <button className="btn-secondary-prem" onClick={modal.onCancel}>Cancel</button>
              )}
              <button className="btn-premium" style={{ width: "auto", padding: "10px 20px" }} onClick={() => modal.onConfirm(modal.value)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;

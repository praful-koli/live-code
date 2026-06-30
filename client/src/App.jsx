import { useEffect, useMemo, useRef, useState } from "react";
import socket from "./socket";

const API_BASE = import.meta.env.VITE_SERVER_URL 
  ? `${import.meta.env.VITE_SERVER_URL}/api/v1/rooms` 
  : "http://localhost:3000/api/v1/rooms";

const App = () => {
  // Join / Create State
  const [activeTab, setActiveTab] = useState("join"); // "join" | "create"
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participantId, setParticipantId] = useState("");
  
  // Realtime State
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingUsers, setEditingUsers] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [activityLog, setActivityLog] = useState([]);
  
  // Document State
  const [editorContent, setEditorContent] = useState("");
  const [version, setVersion] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Sockets status
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketStatus, setSocketStatus] = useState(socket.connected ? "connected" : "disconnected");

  // Refs for tracking changes without triggering re-renders
  const textareaRef = useRef(null);
  const editorContentRef = useRef("");
  const versionRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Synchronize refs with state
  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  // Load session from localStorage if available
  useEffect(() => {
    const cachedRoom = localStorage.getItem("coderoom_code");
    const cachedName = localStorage.getItem("coderoom_name");
    const cachedParticipantId = localStorage.getItem("coderoom_participant_id");
    const cachedIsHost = localStorage.getItem("coderoom_is_host") === "true";

    if (cachedRoom && cachedName && cachedParticipantId) {
      setRoomCode(cachedRoom);
      setDisplayName(cachedName);
      setParticipantId(cachedParticipantId);
      setIsHost(cachedIsHost);
      
      // Auto-rejoin if session exists
      handleJoinSession(cachedRoom, cachedParticipantId, cachedName, cachedIsHost);
    }
  }, []);

  // Helper to add activity log entry
  const logActivity = (message) => {
    setActivityLog((prev) => [
      ...prev.slice(-49), // Keep last 50 entries
      { id: Math.random().toString(), text: message, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Socket listener setup
  useEffect(() => {
    // 1. Participant List updates
    const handleParticipantList = (list) => {
      setParticipants(list || []);
    };

    // 2. Participant Joined event
    const handleParticipantJoined = (payload) => {
      logActivity(payload.message || `${payload.name} joined the room`);
    };

    // 3. Participant Left event
    const handleParticipantLeft = (payload) => {
      logActivity(payload.message || `${payload.name} left the room`);
    };

    // 4. Typing indicators
    const handlePresenceTyping = ({ participant }) => {
      setTypingUsers((prev) => [...new Set([...prev, participant.name])]);
    };

    const handlePresenceStopTyping = ({ participant }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== participant.name));
    };

    // 5. Active Editor / Cursor indicators
    const handlePresenceActiveEditor = ({ participant, message: msg }) => {
      logActivity(msg);
    };

    const handleDocCursor = ({ cursor }) => {
      if (!cursor || !cursor.participantId) return;
      setEditingUsers((prev) => ({
        ...prev,
        [cursor.participantId]: {
          name: cursor.participantName,
          position: cursor.position,
          timestamp: Date.now(),
        },
      }));
    };

    // 6. Document Sync Sockets
    const handleDocLoad = ({ content, version: serverVersion }) => {
      setEditorContent(content);
      setVersion(serverVersion);
      logActivity(`Loaded document state (v${serverVersion})`);
    };

    const handleDocAck = ({ version: ackVersion }) => {
      setVersion(ackVersion);
    };

    const handleDocDelta = ({ delta, version: serverVersion }) => {
      const currentText = editorContentRef.current;
      const currentCursor = textareaRef.current ? textareaRef.current.selectionStart : 0;

      // Apply the remote delta
      let newText = currentText;
      if (delta.type === "insert") {
        newText = currentText.slice(0, delta.position) + delta.text + currentText.slice(delta.position);
      } else if (delta.type === "delete") {
        const deleteLen = delta.text.length || 1;
        newText = currentText.slice(0, delta.position) + currentText.slice(delta.position + deleteLen);
      }

      setEditorContent(newText);
      setVersion(serverVersion);

      // Adjust cursor position so it doesn't jump
      let adjustedCursor = currentCursor;
      if (delta.type === "insert") {
        if (delta.position <= currentCursor) {
          adjustedCursor += delta.text.length;
        }
      } else if (delta.type === "delete") {
        if (delta.position < currentCursor) {
          const deleteLen = delta.text.length || 1;
          if (delta.position + deleteLen <= currentCursor) {
            adjustedCursor -= deleteLen;
          } else {
            adjustedCursor = delta.position;
          }
        }
      }

      // Restore cursor position on next tick
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = adjustedCursor;
          textareaRef.current.selectionEnd = adjustedCursor;
        }
      }, 0);

      logActivity(`${delta.participantName} edited document (v${serverVersion})`);
    };

    const handleDocSync = ({ content, version: serverVersion }) => {
      setEditorContent(content);
      setVersion(serverVersion);
      logActivity(`Full document synchronized (v${serverVersion})`);
    };

    const handleSocketError = (err) => {
      setStatusMessage(`Socket Error: ${err.message}`);
      logActivity(`Error: ${err.message}`);
    };

    // Connection events
    const handleConnected = () => {
      setIsConnected(true);
      setSocketStatus("connected");
      setStatusMessage("Realtime server connected");
      logActivity("Connected to socket server");
    };

    const handleDisconnected = (reason) => {
      setIsConnected(false);
      setSocketStatus("disconnected");
      setStatusMessage(`Disconnected: ${reason}`);
      logActivity(`Disconnected: ${reason}`);
    };

    socket.on("connect", handleConnected);
    socket.on("disconnect", handleDisconnected);
    socket.on("participant:list", handleParticipantList);
    socket.on("participant:joined", handleParticipantJoined);
    socket.on("participant:left", handleParticipantLeft);
    socket.on("presence:typing", handlePresenceTyping);
    socket.on("presence:stop-typing", handlePresenceStopTyping);
    socket.on("presence:active-editor", handlePresenceActiveEditor);
    socket.on("doc:cursor", handleDocCursor);
    socket.on("doc:load", handleDocLoad);
    socket.on("doc:ack", handleDocAck);
    socket.on("doc:delta", handleDocDelta);
    socket.on("doc:sync", handleDocSync);
    socket.on("socket:error", handleSocketError);

    // Clean up cursor indicators that are older than 10 seconds
    const cursorInterval = setInterval(() => {
      const now = Date.now();
      setEditingUsers((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [id, user] of Object.entries(next)) {
          if (now - user.timestamp > 10000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);

    return () => {
      socket.off("connect", handleConnected);
      socket.off("disconnect", handleDisconnected);
      socket.off("participant:list", handleParticipantList);
      socket.off("participant:joined", handleParticipantJoined);
      socket.off("participant:left", handleParticipantLeft);
      socket.off("presence:typing", handlePresenceTyping);
      socket.off("presence:stop-typing", handlePresenceStopTyping);
      socket.off("presence:active-editor", handlePresenceActiveEditor);
      socket.off("doc:cursor", handleDocCursor);
      socket.off("doc:load", handleDocLoad);
      socket.off("doc:ack", handleDocAck);
      socket.off("doc:delta", handleDocDelta);
      socket.off("doc:sync", handleDocSync);
      socket.off("socket:error", handleSocketError);
      clearInterval(cursorInterval);
    };
  }, []);

  // Socket connection helper
  const handleJoinSession = (code, pId, name, hostFlag) => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("room:join", { roomCode: code.toUpperCase(), participantId: pId });
    socket.emit("doc:load", { roomCode: code.toUpperCase() });
    
    // Fetch room properties to see if it is locked
    fetch(`${API_BASE}/${code}`, { credentials: "include" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data) {
          setIsLocked(payload.data.isLocked || false);
        }
      })
      .catch((err) => console.error("Error fetching room status:", err));

    setJoined(true);
    setStatusMessage(`Joined CodeRoom ${code}`);
    logActivity(`Session connected. Welcome, ${name}!`);
  };

  // 1. Create Room Flow
  const handleCreateRoom = async () => {
    if (!roomName.trim() || !displayName.trim()) {
      setStatusMessage("Enter both room name and host name.");
      return;
    }

    try {
      setStatusMessage("Creating room...");
      const res = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: roomName.trim(), hostName: displayName.trim() }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create room");
      }

      const { room, participant, hostKey } = result.data;

      // Save to localStorage for refresh resistance
      localStorage.setItem("coderoom_code", room.roomCode);
      localStorage.setItem("coderoom_name", participant.name);
      localStorage.setItem("coderoom_participant_id", participant._id);
      localStorage.setItem("coderoom_is_host", "true");

      setRoomCode(room.roomCode);
      setParticipantId(participant._id);
      setIsHost(true);

      // Connect Sockets
      handleJoinSession(room.roomCode, participant._id, participant.name, true);
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  // 2. Join Room Flow
  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !displayName.trim()) {
      setStatusMessage("Enter both room code and display name.");
      return;
    }

    try {
      setStatusMessage("Joining room...");
      const res = await fetch(`${API_BASE}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase(), name: displayName.trim() }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to join room");
      }

      const { room, participant } = result.data;

      // Save to localStorage
      localStorage.setItem("coderoom_code", room.roomCode);
      localStorage.setItem("coderoom_name", participant.name);
      localStorage.setItem("coderoom_participant_id", participant._id);
      localStorage.setItem("coderoom_is_host", "false");

      setParticipantId(participant._id);
      setIsHost(false);

      // Connect Sockets
      handleJoinSession(room.roomCode, participant._id, participant.name, false);
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  // 3. Leave Room Flow
  const handleLeave = () => {
    socket.emit("room:leave");
    socket.disconnect();

    // Clear localStorage session
    localStorage.removeItem("coderoom_code");
    localStorage.removeItem("coderoom_name");
    localStorage.removeItem("coderoom_participant_id");
    localStorage.removeItem("coderoom_is_host");

    setJoined(false);
    setIsHost(false);
    setParticipants([]);
    setTypingUsers([]);
    setEditingUsers({});
    setEditorContent("");
    setVersion(0);
    setStatusMessage("You left the room");
    logActivity("You left the room session");
  };

  // 4. Input Textarea Change (Delta sync)
  const handleEditorChange = (e) => {
    const newValue = e.target.value;
    const oldValue = editorContentRef.current;
    
    // Set local state immediately for responsiveness
    setEditorContent(newValue);

    if (!joined) return;

    // Emit Typing Presence
    socket.emit("presence:typing", {
      roomCode: roomCode.toUpperCase(),
      participant: { name: displayName, id: participantId },
    });

    // Clear previous stop-typing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("presence:stop-typing", {
        roomCode: roomCode.toUpperCase(),
        participant: { name: displayName, id: participantId },
      });
    }, 1500);

    // Calculate Delta
    let start = 0;
    while (start < oldValue.length && start < newValue.length && oldValue[start] === newValue[start]) {
      start++;
    }

    let endOld = oldValue.length;
    let endNew = newValue.length;
    while (endOld > start && endNew > start && oldValue[endOld - 1] === newValue[endNew - 1]) {
      endOld--;
      endNew--;
    }

    let delta = null;
    if (newValue.length > oldValue.length) {
      // Insertion delta
      delta = {
        type: "insert",
        position: start,
        text: newValue.slice(start, endNew),
        version: versionRef.current,
        participantId,
        participantName: displayName,
      };
    } else if (newValue.length < oldValue.length) {
      // Deletion delta
      delta = {
        type: "delete",
        position: start,
        text: oldValue.slice(start, endOld),
        version: versionRef.current,
        participantId,
        participantName: displayName,
      };
    }

    if (delta) {
      socket.emit("doc:delta", { roomCode: roomCode.toUpperCase(), delta });
    }
  };

  // 5. Cursor selection tracking (Relay to other users)
  const handleSelection = (e) => {
    if (!joined) return;
    const position = e.target.selectionStart;
    
    socket.emit("doc:cursor", {
      roomCode: roomCode.toUpperCase(),
      cursor: {
        participantId,
        participantName: displayName,
        position,
      },
    });
  };

  // Host Control - Rename Room
  const handleRenameRoom = async () => {
    const newName = prompt("Enter new room name:");
    if (!newName || !newName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/${roomCode.toUpperCase()}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: newName.trim() }),
        credentials: "include", // Ensure cookies with hostKey are sent
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      logActivity(`Host renamed room to "${newName.trim()}"`);
      setStatusMessage(`Room renamed to "${newName.trim()}"`);
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
    }
  };

  // Host Control - Lock Room
  const handleLockRoom = async () => {
    try {
      const res = await fetch(`${API_BASE}/${roomCode.toUpperCase()}/lock`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setIsLocked(true);
      logActivity("Host locked the room. No new members can join.");
    } catch (err) {
      alert(`Lock failed: ${err.message}`);
    }
  };

  // Host Control - Unlock Room
  const handleUnlockRoom = async () => {
    try {
      const res = await fetch(`${API_BASE}/${roomCode.toUpperCase()}/unlock`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setIsLocked(false);
      logActivity("Host unlocked the room.");
    } catch (err) {
      alert(`Unlock failed: ${err.message}`);
    }
  };

  // Host Control - Close Room
  const handleCloseRoom = async () => {
    if (!confirm("Are you sure you want to CLOSE the room for everyone?")) return;

    try {
      const res = await fetch(`${API_BASE}/${roomCode.toUpperCase()}/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      logActivity("Host closed the room session.");
      handleLeave();
    } catch (err) {
      alert(`Close failed: ${err.message}`);
    }
  };

  // Host Control - Kick Participant
  const handleKickParticipant = async (targetId, targetName) => {
    if (!confirm(`Are you sure you want to kick ${targetName}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/${roomCode.toUpperCase()}/participants/${targetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      logActivity(`Host kicked ${targetName} from the room`);
    } catch (err) {
      alert(`Kick failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Header Section */}
        <header className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-5 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">CodeRoom Editor</p>
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Collaborate in Realtime
              </h1>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-400">
                A high-performance live coding space with position-shift conflict resolution. Free of CRDT libraries.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                isConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                {socketStatus}
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700/50 px-4 py-1.5 text-xs font-semibold tracking-wider text-slate-300">
                {joined ? `ROOM: ${roomCode.toUpperCase()}` : "Not joined"}
              </span>
            </div>
          </div>
        </header>

        {/* Auth Landing Page */}
        {!joined ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 md:p-8 shadow-xl shadow-slate-950/20">
              
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800/50 mb-6">
                <button
                  onClick={() => { setActiveTab("join"); setStatusMessage(""); }}
                  className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold tracking-wider transition ${
                    activeTab === "join" ? "bg-slate-800 text-cyan-400 shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Join Room
                </button>
                <button
                  onClick={() => { setActiveTab("create"); setStatusMessage(""); }}
                  className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold tracking-wider transition ${
                    activeTab === "create" ? "bg-slate-800 text-cyan-400 shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Room
                </button>
              </div>

              {activeTab === "join" ? (
                // JOIN ROOM FORM
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white">Enter Room Details</h2>
                  <p className="text-xs md:text-sm text-slate-400">Join a friend's active session using their room code.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Room Code</label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none transition font-mono uppercase"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="ABC123"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Your Name</label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none transition"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Alice"
                      />
                    </div>
                    <button
                      className="w-full rounded-2xl bg-cyan-500/90 py-4 font-bold text-slate-950 tracking-wider hover:bg-cyan-400 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                      onClick={handleJoinRoom}
                    >
                      Join CodeRoom
                    </button>
                  </div>
                </div>
              ) : (
                // CREATE ROOM FORM
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white">Create a New Room</h2>
                  <p className="text-xs md:text-sm text-slate-400">Start a new shared editor and invite your teammates.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Room Name</label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none transition"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="My Project Workspace"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Your Display Name</label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none transition"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Host User"
                      />
                    </div>
                    <button
                      className="w-full rounded-2xl bg-cyan-500/90 py-4 font-bold text-slate-950 tracking-wider hover:bg-cyan-400 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                      onClick={handleCreateRoom}
                    >
                      Create CodeRoom
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Guide */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 shadow-xl shadow-slate-950/10 space-y-6">
              <h2 className="text-xl font-bold text-white">Sprint Specs</h2>
              <div className="space-y-4 text-sm text-slate-400">
                <div className="flex gap-3">
                  <span className="text-cyan-400">✔</span>
                  <p><strong className="text-slate-200">OT-Lite Engine:</strong> Delta-based position shift resolves conflicts cleanly.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400">✔</span>
                  <p><strong className="text-slate-200">No Banned Libs:</strong> Designed custom conflict resolution without Yjs/Automerge.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400">✔</span>
                  <p><strong className="text-slate-200">DB Persistence:</strong> State persisted automatically in MongoDB Atlas.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400">✔</span>
                  <p><strong className="text-slate-200">Presence Sockets:</strong> Dynamic typing indicators + active cursors.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400">✔</span>
                  <p><strong className="text-slate-200">Host Controls:</strong> Lock room, rename, close or kick participants directly.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // COLLABORATIVE APP WORKSPACE
          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
            
            {/* Left sidebar - info, participants, presence */}
            <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-xl shadow-slate-950/20">
              
              {/* Room Stats */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Room Code</p>
                    <p className="text-xl font-mono font-bold text-cyan-400">{roomCode.toUpperCase()}</p>
                  </div>
                  <button
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    onClick={handleLeave}
                  >
                    Leave Room
                  </button>
                </div>
                <div className="rounded-xl bg-slate-900/40 p-3 border border-slate-800/40">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Role</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-white">{displayName}</span>
                    {isHost ? (
                      <span className="rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 uppercase border border-cyan-500/20">
                        Host
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 uppercase border border-slate-700">
                        Member
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Control Panel */}
              {isHost && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Host Controls</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleRenameRoom}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2.5 transition text-slate-200 cursor-pointer"
                    >
                      Rename Room
                    </button>
                    {isLocked ? (
                      <button
                        onClick={handleUnlockRoom}
                        className="rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold py-2.5 transition text-emerald-400 cursor-pointer"
                      >
                        Unlock Room
                      </button>
                    ) : (
                      <button
                        onClick={handleLockRoom}
                        className="rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold py-2.5 transition text-amber-400 cursor-pointer"
                      >
                        Lock Room
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleCloseRoom}
                    className="w-full rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold py-2.5 transition text-rose-400 cursor-pointer"
                  >
                    Close & Delete Room
                  </button>
                </div>
              )}

              {/* Participants list */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Participants</p>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-semibold">{participants.length}</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {participants.map((p) => {
                    const isSelf = p._id === participantId;
                    const activeCursor = editingUsers[p._id];
                    return (
                      <div key={p._id} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/30 px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${p.isOnline ? "bg-emerald-400" : "bg-slate-600"}`}></span>
                            <span className="text-sm font-semibold text-white truncate max-w-[120px]">{p.name}</span>
                            {p.isHost && (
                              <span className="text-[9px] font-bold text-cyan-400 uppercase">H</span>
                            )}
                          </div>
                          {activeCursor && (
                            <p className="text-[10px] text-slate-500">Cursor @ pos {activeCursor.position}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {typingUsers.includes(p.name) ? (
                            <span className="rounded bg-cyan-500/10 text-cyan-400 text-[9px] font-bold px-1 py-0.5 uppercase border border-cyan-500/20">
                              typing
                            </span>
                          ) : p.isOnline ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1 py-0.5 uppercase border border-emerald-500/20">
                              online
                            </span>
                          ) : (
                            <span className="rounded bg-slate-800 text-slate-500 text-[9px] font-semibold px-1 py-0.5 uppercase">
                              offline
                            </span>
                          )}

                          {isHost && !p.isHost && (
                            <button
                              onClick={() => handleKickParticipant(p._id, p.name)}
                              className="text-slate-500 hover:text-rose-400 text-xs font-bold px-1 transition cursor-pointer"
                              title="Kick participant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Log */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Activity History</p>
                <div className="h-[120px] overflow-y-auto pr-1 text-xs space-y-2 font-mono scrollbar-none">
                  {activityLog.length === 0 ? (
                    <p className="text-slate-600">No events yet.</p>
                  ) : (
                    activityLog.map((log) => (
                      <div key={log.id} className="text-slate-500 flex gap-2">
                        <span className="text-slate-600">{log.time}</span>
                        <span className="text-slate-300 break-words">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* Right side - Text Editor */}
            <main className="rounded-3xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-xl shadow-slate-950/20 flex flex-col">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Shared Document</p>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Live Shared Editor</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 font-mono">
                    Version: {version}
                  </span>
                  <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 font-mono">
                    Length: {editorContent.length} chars
                  </span>
                </div>
              </div>

              {/* Textarea container */}
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-inner flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-3">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Monospace Text Field</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    syncing
                  </span>
                </div>
                
                <textarea
                  ref={textareaRef}
                  className="h-[600px] w-full resize-none border-0 bg-transparent px-5 py-5 text-sm leading-6 text-slate-100 font-mono focus:outline-none placeholder:text-slate-800"
                  value={editorContent}
                  onChange={handleEditorChange}
                  onSelect={handleSelection}
                  onKeyUp={handleSelection}
                  placeholder="// Type code here to sync live with teammates..."
                />
              </div>
            </main>
          </div>
        )}

        {/* Global Toast Status Bar */}
        {statusMessage && (
          <footer className="fixed bottom-4 right-4 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 shadow-2xl z-50 text-xs font-mono text-cyan-300 max-w-[400px]">
            {statusMessage}
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;

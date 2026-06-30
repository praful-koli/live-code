import { useEffect, useMemo, useState } from "react";
import socket from "./socket";

const ROOM_EVENTS = {
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  ROOM_PARTICIPANTS: "room-participants",
  USER_TYPING: "user-typing",
  USER_STOPPED_TYPING: "user-stopped-typing",
  USER_CURSOR: "user-cursor",
  PRESENCE_UPDATE: "presence-update",
};

const App = () => {
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingUsers, setEditingUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketStatus, setSocketStatus] = useState(socket.connected ? "connected" : "disconnected");

  useEffect(() => {
    const handleParticipants = (payload) => {
      setParticipants(payload.participants || []);
    };

    const handlePresence = (payload) => {
      if (!payload || !payload.userId) return;
      const { userId, name, status, cursorPosition } = payload;

      if (status === "typing") {
        setTypingUsers((current) => [...new Set([...current, name])]);
      } else {
        setTypingUsers((current) => current.filter((item) => item !== name));
      }

      if (status === "editing") {
        setEditingUsers((current) => [...new Set([...current, `${name}@${cursorPosition}`])]);
      } else if (status === "idle" || status === "left") {
        setEditingUsers((current) => current.filter((item) => !item.startsWith(`${name}@`)));
      }

      if (status === "left") {
        setStatusMessage(`${name} left the room`);
      } else if (status === "editing") {
        setStatusMessage(`${name} is editing at position ${cursorPosition}`);
      } else if (status === "typing") {
        setStatusMessage(`${name} is typing...`);
      } else if (status === "idle") {
        setStatusMessage("");
      }
    };

    const handleConnected = () => {
      setIsConnected(true);
      setSocketStatus("connected");
      setStatusMessage("Realtime server connected.");
    };

    const handleDisconnected = (reason) => {
      setIsConnected(false);
      setSocketStatus("disconnected");
      setStatusMessage(`Disconnected from realtime server: ${reason}`);
      setTypingUsers([]);
      setEditingUsers([]);
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setSocketStatus("connect error");
      setStatusMessage("Unable to connect to realtime server.");
    };

    socket.on(ROOM_EVENTS.ROOM_PARTICIPANTS, handleParticipants);
    socket.on(ROOM_EVENTS.PRESENCE_UPDATE, handlePresence);
    socket.on("connect", handleConnected);
    socket.on("disconnect", handleDisconnected);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off(ROOM_EVENTS.ROOM_PARTICIPANTS, handleParticipants);
      socket.off(ROOM_EVENTS.PRESENCE_UPDATE, handlePresence);
      socket.off("connect", handleConnected);
      socket.off("disconnect", handleDisconnected);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  const localUserId = useMemo(() => displayName.trim().toLowerCase().replace(/\s+/g, "-") || "guest", [displayName]);

  const connectSocket = () => {
    if (!socket.connected) {
      socket.connect();
    }
  };

  const handleJoin = () => {
    if (!roomCode.trim() || !displayName.trim()) {
      setStatusMessage("Enter both room code and name to join.");
      return;
    }

    connectSocket();
    socket.emit(ROOM_EVENTS.JOIN_ROOM, {
      roomCode: roomCode.trim().toUpperCase(),
      userId: localUserId,
      name: displayName.trim(),
    });
    setJoined(true);
    setStatusMessage(`Joined room ${roomCode.trim().toUpperCase()}`);
  };

  const handleLeave = () => {
    socket.emit(ROOM_EVENTS.LEAVE_ROOM);
    socket.disconnect();
    setJoined(false);
    setParticipants([]);
    setTypingUsers([]);
    setEditingUsers([]);
    setStatusMessage("You left the room");
  };

  const handleTyping = (value) => {
    setMessage(value);
    if (!joined) return;
    if (value.trim().length > 0) {
      socket.emit(ROOM_EVENTS.USER_TYPING);
    } else {
      socket.emit(ROOM_EVENTS.USER_STOPPED_TYPING);
    }
  };

  const handleCursorUpdate = (cursorPosition) => {
    if (!joined) return;
    socket.emit(ROOM_EVENTS.USER_CURSOR, { cursorPosition });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl border border-slate-700 bg-slate-900 px-6 py-5 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Live Coding Room</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Code together in realtime</h1>
              <p className="mt-2 max-w-2xl text-slate-400">Join a room code, open the shared editor, and collaborate with live presence updates.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm ${isConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                {socketStatus}
              </span>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                {joined ? `Room ${roomCode.trim().toUpperCase()}` : "Not joined"}
              </span>
            </div>
          </div>
        </header>

        {!joined ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
              <h2 className="text-2xl font-semibold text-white">Enter room details</h2>
              <p className="mt-2 text-slate-400">Use the room code and your display name to join a live code session.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm text-slate-400">Room Code</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="ABC123"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Display Name</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alice"
                  />
                </div>
                <button
                  className="w-full rounded-2xl bg-cyan-500 px-5 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400"
                  onClick={handleJoin}
                >
                  Join Live Code Room
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/10">
              <h2 className="text-2xl font-semibold text-white">What to expect</h2>
              <ul className="mt-4 space-y-3 text-slate-400">
                <li>• Shared room-based live collaboration</li>
                <li>• Realtime participant list</li>
                <li>• Typing and editing presence</li>
                <li>• Approximate cursor position tracking</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
            <aside className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Room Code</p>
                    <p className="text-lg font-semibold text-white">{roomCode.trim().toUpperCase()}</p>
                  </div>
                  <button
                    className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    onClick={handleLeave}
                  >
                    Leave
                  </button>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">You are</p>
                  <p className="mt-1 text-lg font-medium text-white">{displayName.trim()}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-white">Participants</p>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{participants.length}</span>
                </div>
                <div className="space-y-3">
                  {participants.length === 0 ? (
                    <p className="text-sm text-slate-400">No one else yet.</p>
                  ) : (
                    participants.map((participant) => (
                      <div key={participant.userId} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{participant.name}</p>
                            <p className="text-xs text-slate-500">{participant.userId}</p>
                          </div>
                          {participant.isEditing ? (
                            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                              editing
                            </span>
                          ) : participant.isTyping ? (
                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                              typing
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                              idle
                            </span>
                          )}
                        </div>
                        {participant.isEditing && participant.cursorPosition != null ? (
                          <p className="mt-2 text-xs text-slate-500">Cursor @ {participant.cursorPosition}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4">
                <p className="font-semibold text-white">Presence</p>
                <div className="mt-3 min-h-[80px] rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-300">
                  {editingUsers.length > 0 ? (
                    <div className="space-y-1">
                      {editingUsers.map((editEntry) => {
                        const [name, position] = editEntry.split("@");
                        return (
                          <p key={editEntry} className="text-slate-300">
                            {name} is editing at position {position}
                          </p>
                        );
                      })}
                    </div>
                  ) : typingUsers.length > 0 ? (
                    <p>{typingUsers.join(", ")} is typing...</p>
                  ) : (
                    <p>{statusMessage || "No activity yet."}</p>
                  )}
                </div>
              </div>
            </aside>

            <main className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Shared editor</p>
                  <h2 className="text-3xl font-semibold text-white">Live code editor</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">Realtime updates</span>
                  <button
                    className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                    onClick={() => setStatusMessage("Code synced across participants.")}
                  >
                    Sync status
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3">
                  <span className="text-sm text-slate-400">Shared code pane</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Live</span>
                </div>
                <textarea
                  className="h-[610px] w-full resize-none border-0 bg-slate-950 px-5 py-5 text-sm leading-6 text-slate-100 font-mono focus:outline-none"
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  onSelect={(e) => handleCursorUpdate(e.target.selectionStart)}
                  onKeyUp={(e) => handleCursorUpdate(e.target.selectionStart)}
                  placeholder="Start typing code here..."
                />
              </div>
            </main>
          </div>
        )}

        {statusMessage ? <p className="text-sm text-cyan-200">{statusMessage}</p> : null}
      </div>
    </div>
  );
};

export default App;

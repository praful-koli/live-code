import {
  addRoomParticipant,
  clearParticipantBySocket,
  getRoomParticipants,
  removeRoomParticipant,
} from "../realtime/roomState.js";

const ROOM_EVENTS = {
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  ROOM_PARTICIPANTS: "room-participants",
  USER_TYPING: "user-typing",
  USER_STOPPED_TYPING: "user-stopped-typing",
  USER_CURSOR: "user-cursor",
  PRESENCE_UPDATE: "presence-update",
};

const buildParticipantPayload = ({ userId, name, socketId, isTyping, isEditing, cursorPosition }) => ({
  userId,
  name,
  socketId,
  isTyping: Boolean(isTyping),
  isEditing: Boolean(isEditing),
  cursorPosition: cursorPosition ?? null,
});

const emitParticipantList = (io, roomCode) => {
  const participants = getRoomParticipants(roomCode).map((participant) => ({
    userId: participant.userId,
    name: participant.name,
    isTyping: participant.isTyping || false,
    isEditing: participant.isEditing || false,
    cursorPosition: participant.cursorPosition ?? null,
  }));
  io.to(roomCode).emit(ROOM_EVENTS.ROOM_PARTICIPANTS, { participants });
};

export const registerSocketHandlers = (io, socket) => {
  let joinedRoomCode = null;

  socket.on(ROOM_EVENTS.JOIN_ROOM, (payload) => {
    const { roomCode, userId, name } = payload || {};
    if (!roomCode || !userId || !name) {
      return;
    }

    joinedRoomCode = roomCode.toUpperCase();
    socket.join(joinedRoomCode);

    addRoomParticipant(joinedRoomCode, {
      socketId: socket.id,
      userId,
      name,
      isTyping: false,
      isEditing: false,
      cursorPosition: null,
    });

    emitParticipantList(io, joinedRoomCode);
  });

  socket.on(ROOM_EVENTS.LEAVE_ROOM, () => {
    if (!joinedRoomCode) return;
    removeRoomParticipant(joinedRoomCode, socket.id);
    socket.leave(joinedRoomCode);
    emitParticipantList(io, joinedRoomCode);
    joinedRoomCode = null;
  });

  socket.on(ROOM_EVENTS.USER_TYPING, () => {
    if (!joinedRoomCode) return;
    const roomParticipants = getRoomParticipants(joinedRoomCode);
    const participant = roomParticipants.find((item) => item.socketId === socket.id);
    if (!participant) return;
    participant.isTyping = true;
    io.to(joinedRoomCode).emit(ROOM_EVENTS.PRESENCE_UPDATE, {
      userId: participant.userId,
      name: participant.name,
      status: "typing",
    });
    emitParticipantList(io, joinedRoomCode);
  });

  socket.on(ROOM_EVENTS.USER_CURSOR, (payload) => {
    if (!joinedRoomCode) return;
    const cursorPosition = payload?.cursorPosition;
    if (cursorPosition == null) return;

    const roomParticipants = getRoomParticipants(joinedRoomCode);
    const participant = roomParticipants.find((item) => item.socketId === socket.id);
    if (!participant) return;

    participant.isEditing = true;
    participant.cursorPosition = cursorPosition;
    io.to(joinedRoomCode).emit(ROOM_EVENTS.PRESENCE_UPDATE, {
      userId: participant.userId,
      name: participant.name,
      status: "editing",
      cursorPosition,
    });
    emitParticipantList(io, joinedRoomCode);
  });

  socket.on(ROOM_EVENTS.USER_STOPPED_TYPING, () => {
    if (!joinedRoomCode) return;
    const roomParticipants = getRoomParticipants(joinedRoomCode);
    const participant = roomParticipants.find((item) => item.socketId === socket.id);
    if (!participant) return;
    participant.isTyping = false;
    participant.isEditing = false;
    participant.cursorPosition = null;
    io.to(joinedRoomCode).emit(ROOM_EVENTS.PRESENCE_UPDATE, {
      userId: participant.userId,
      name: participant.name,
      status: "idle",
    });
    emitParticipantList(io, joinedRoomCode);
  });

  socket.on("disconnect", () => {
    const roomData = clearParticipantBySocket(socket.id);
    if (!roomData) return;
    const { roomCode } = roomData;
    io.to(roomCode).emit(ROOM_EVENTS.PRESENCE_UPDATE, {
      userId: roomData.participant.userId,
      name: roomData.participant.name,
      status: "left",
    });
    emitParticipantList(io, roomCode);
  });
};

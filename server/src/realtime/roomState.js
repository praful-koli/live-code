const rooms = new Map();

export const getRoomParticipants = (roomCode) => {
  const room = rooms.get(roomCode);
  return room ? [...room.values()] : [];
};

export const addRoomParticipant = (roomCode, participant) => {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Map());
  }
  rooms.get(roomCode).set(participant.socketId, participant);
};

export const removeRoomParticipant = (roomCode, socketId) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.delete(socketId);
  if (room.size === 0) {
    rooms.delete(roomCode);
  }
};

export const getParticipantBySocket = (roomCode, socketId) => {
  const room = rooms.get(roomCode);
  return room ? room.get(socketId) : null;
};

export const clearParticipantBySocket = (socketId) => {
  for (const [roomCode, room] of rooms) {
    if (room.has(socketId)) {
      const participant = room.get(socketId);
      room.delete(socketId);
      if (room.size === 0) rooms.delete(roomCode);
      return { roomCode, participant };
    }
  }
  return null;
};

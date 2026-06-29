import Room from "./room.model.js";

export const createRoomRepo = (data) => {
  return Room.create(data);
};

export const findRoomByCodeRepo = (roomCode) => {
  return Room.findOne({ roomCode: roomCode.toUpperCase() });
};

export const updateRoomRepo = (roomId, data) => {
  return Room.findByIdAndUpdate(roomId, data, { new: true });
};

import Room from "./room.model.js";

class RoomRepository {
  async create(data) {
    return Room.create(data);
  }

  async findByRoomCode(roomCode) {
    return Room.findOne({ roomCode: roomCode.toUpperCase() });
  }
  
  async findByRoomCodeWithHostKey(roomCode) {
  return Room.findOne({ roomCode: roomCode.toUpperCase() }).select("+hostKey");
}

  async updateById(roomId, data) {
    return Room.findByIdAndUpdate(roomId, data, { new: true });
  }
}

export default new RoomRepository();
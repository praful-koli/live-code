import Participant from "./participant.model.js";

class ParticipantRepository {
  async create(data) {
    return Participant.create(data);
  }

  async findById(id) {
    return Participant.findById(id);
  }

  async findByIdWithHostKey(id) {
    return Participant.findById(id).select("+hostKey");
  }

  async findByRoomId(roomId) {
    return Participant.find({
      roomId,
      isRemoved: false,
    }).select("-hostKey -__v");
  }

  async updateById(id, data) {
    return Participant.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async findBySocketId(socketId) {
    return Participant.findOne({ socketId });
  }
}

export default new ParticipantRepository();
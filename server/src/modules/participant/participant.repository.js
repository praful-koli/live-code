import Participant from "./participant.model.js";

class ParticipantRepository {
  async create(data) {
    return Participant.create(data);
  }

  async findById(participantId) {
    return Participant.findById(participantId);
  }

  async findByIdWithHostKey(participantId) {
    return Participant.findById(participantId).select("+hostKey");
  }

  async findByRoomId(roomId) {
    return Participant.find({
      roomId,
      isRemoved: false,
    }).select("-hostKey -__v");
  }

  async updateById(participantId, data) {
    return Participant.findByIdAndUpdate(participantId, data, {
      new: true,
    });
  }
}

export default new ParticipantRepository();
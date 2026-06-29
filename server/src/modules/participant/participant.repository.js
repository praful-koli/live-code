
import Participant from "./participant.model.js";

class ParticipantRepository {
  async create(data) {
    return Participant.create(data);
  }

  async findById(id) {
    return Participant.findById(id);
  }

  async findByRoomId(roomId) {
    return Participant.find({ roomId }).select("-__v");
  }

  async updateById(id, data) {
    return Participant.findByIdAndUpdate(id, data, { new: true });
  }
}

export default new ParticipantRepository();
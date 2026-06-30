
import participantRepository from "./participant.repository.js";
import roomRepository from "../room/room.repository.js";
import { generateHostKey } from "../../shared/utils/generateHostKey.js";
import { generateRoomCode } from "../../shared/utils/generateRoomCode.js";

class ParticipantService {
  async getRoomParticipants(roomCode) {
    const room = await roomRepository.findByRoomCode(roomCode);
    if (!room) throw new Error("Room not found");

    return participantRepository.findByRoomId(room._id);
  }

  async updateSocket(participantId, socketId) {
    return participantRepository.updateById(participantId, {
      socketId,
      isOnline: true,
    });
  }

  async markOffline(participantId) {
    return participantRepository.updateById(participantId, {
      socketId: null,
      isOnline: false,
    });
  }
}

export default new ParticipantService();
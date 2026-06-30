import participantRepository from "./participant.repository.js";
import roomRepository from "../room/room.repository.js";
import ApiError from "../../shared/error/ApiError.js";

class ParticipantService {
  async getRoomParticipants(roomCode) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    return participantRepository.findByRoomId(room._id);
  }

  async updateSocket(participantId, socketId) {
    const participant = await participantRepository.findById(participantId);

    if (!participant) {
      throw ApiError.notFound("Participant not found");
    }

    if (participant.isRemoved) {
      throw ApiError.badRequest("Participant removed from room");
    }

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

  async findBySocketId(socketId) {
    return participantRepository.findBySocketId(socketId);
  }
}

export default new ParticipantService();
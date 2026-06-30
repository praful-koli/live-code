import roomRepository from "./room.repository.js";
import participantRepository from "../participant/participant.repository.js";
import { generateRoomCode } from "../../shared/utils/generateRoomCode.js";
import { generateHostKey } from "../../shared/utils/generateHostKey.js";
import ApiError from "../../shared/error/ApiError.js";

class RoomService {
  async createRoom({ roomName, hostName }) {
    if (!hostName) {
      throw new ApiError.badRequest("Host name is required");
    }

    let roomCode;
    let existingRoom;

    do {
      roomCode = generateRoomCode();
      existingRoom = await roomRepository.findByRoomCode(roomCode);
    } while (existingRoom);

    const hostKey = generateHostKey();

    const room = await roomRepository.create({
      roomCode,
      roomName,
      hostName,
    });

    const hostParticipant = await participantRepository.create({
      roomId: room._id,
      name: hostName,
      isHost: true,
      hostKey,
      isOnline: true,
    });

    room.hostParticipantId = hostParticipant._id;
    await room.save();

    return {
      room,
      participant: {
        _id: hostParticipant._id,
        roomId: hostParticipant.roomId,
        name: hostParticipant.name,
        isHost: hostParticipant.isHost,
        isOnline: hostParticipant.isOnline,
      },
      hostKey,
    };
  }

  async joinRoom({ roomCode, name }) {
    if (!roomCode) {
      throw ApiError.badRequest("Room code is required");
    }

    if (!name) {
      throw ApiError.badRequest("Name is required");
    }

    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.badRequest("Invalid room code");
    }

    if (room.isClosed) {
      throw ApiError.badRequest("Room is closed");
    }

    if (room.isLocked) {
      throw ApiError.badRequest("Room is locked");
    }

    const participant = await participantRepository.create({
      roomId: room._id,
      name,
      isHost: false,
      hostKey: null,
      isOnline: true,
    });

    return {
      room,
      participant,
    };
  }

  async getRoom(roomCode) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw new ApiError.notFound("Room not found");
    }

    return room;
  }

  async checkHost({ participantId, hostKey }) {
    const participant =
      await participantRepository.findByIdWithHostKey(participantId);
    console.log(participantId);
    if (!participant) {
      throw ApiError.notFound("Participant not found");
    }

    if (!participant.isHost) {
      throw ApiError.unauthorized("Only host can perform this action");
    }

    if (participant.hostKey !== hostKey) {
      throw ApiError.unauthorized("Invalid host key");
    }

    return participant;
  }

  async renameRoom({ roomCode, roomName, hostParticipant }) {
    if (!roomName) {
      throw ApiError.badRequest("Room name is required");
    }

    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    return roomRepository.updateById(room._id, {
      roomName,
    });
  }

  async closeRoom({ roomCode }) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    return roomRepository.updateById(room._id, {
      isClosed: true,
    });
  }

  async lockRoom({ roomCode }) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }


    return roomRepository.updateById(room._id, {
      isLocked: true,
    });
  }

  async unlockRoom({ roomCode }) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    return roomRepository.updateById(room._id, {
      isLocked: false,
    });
  }

  async removeParticipant({
    roomCode,
    participantId,
  }) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    const participant = await participantRepository.findById(participantId);
    if (!participant) {
      throw ApiError.notFound("Participant not found");
    }

    if (participant.isHost) {
      throw ApiError.badRequest("Host cannot remove himself");
    }

    return participantRepository.updateById(participantId, {
      isRemoved: true,
      isOnline: false,
      socketId: null,
    });
  }
}

export default new RoomService();

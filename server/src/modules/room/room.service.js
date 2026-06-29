// room.service.js
import roomRepository from "./room.repository.js";
import participantRepository from "../participant/participant.repository.js";
import { generateRoomCode } from "../../shared/utils/generate-room-code.js";

class RoomService {
  async createRoom({ roomName, hostName }) {
    let roomCode;
    let existingRoom;

    do {
      roomCode = generateRoomCode();
      existingRoom = await roomRepository.findByRoomCode(roomCode);
    } while (existingRoom);

    const room = await roomRepository.create({
      roomCode,
      roomName,
      hostName,
    });

    const participant = await participantRepository.create({
      roomId: room._id,
      name: hostName,
      isHost: true,
      isOnline: true,
    });

    room.hostParticipantId = participant._id;
    await room.save();

    return { room, participant };
  }

  async joinRoom({ roomCode, name }) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) throw new Error("Invalid room code");
    if (room.isClosed) throw new Error("Room is closed");
    if (room.isLocked) throw new Error("Room is locked");

    const participant = await participantRepository.create({
      roomId: room._id,
      name,
      isHost: false,
      isOnline: true,
    });

    return { room, participant };
  }

  async renameRoom({ roomCode, participantId, roomName }) {
    const room = await roomRepository.findByRoomCode(roomCode);
    if (!room) throw new Error("Room not found");

    const participant = await participantRepository.findById(participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only host can rename room");
    }

    return roomRepository.updateById(room._id, { roomName });
  }

  async closeRoom({ roomCode, participantId }) {
    const room = await roomRepository.findByRoomCode(roomCode);
    if (!room) throw new Error("Room not found");

    const participant = await participantRepository.findById(participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only host can close room");
    }

    return roomRepository.updateById(room._id, { isClosed: true });
  }
}

export default new RoomService();
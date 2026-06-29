import { generateRoomCode } from "../../shared/utils/generate-room-code.js";

import {
  createRoomRepo,
  findRoomByCodeRepo,
  updateRoomRepo,
} from "./room.repository.js";

import {
  createParticipantRepo,
  findParticipantByIdRepo,
} from "../participant/participant.repository.js";
import Participant from "../participant/participant.model.js";

export const createRoomService = async ({ roomName, hostName }) => {
  let roomCode;
  let existingRoom;

  do {
    roomCode = generateRoomCode();
    existingRoom = await findRoomByCodeRepo(roomCode);
  } while (existingRoom);

  const room = await createRoomRepo({
    roomCode,
    roomName,
    hostName,
  });
  
  const hostParticipant = await createParticipantRepo({
    roomId: room._id,
    name: hostName,
    isHost: true,
    isOnline: true,
  });
 
  room.hostParticipantId = hostParticipant._id;
  await room.save()

  return {
    room,
    participant : hostParticipant
  }
};

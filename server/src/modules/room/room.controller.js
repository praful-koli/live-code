import ApiResponse from "../../shared/utils/ApiResponse.js";
import roomService from "./room.service.js";

class RoomController {
  async createRoom(req, res) {
    const data = await roomService.createRoom(req.body);

    ApiResponse.created(data, "Room created successfully").send(res);
  }

  async joinRoom(req, res) {
    const data = await roomService.joinRoom(req.body);

    ApiResponse.ok(data, "Room joind successfully").send(res);
  }

  async getRoom(req, res) {
    const data = await roomService.getRoom(req.params.roomCode);
    ApiResponse.ok(data, "fetch Room").send(res)
  }

  async renameRoom(req, res) {
    const data = await roomService.renameRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
      hostKey: req.body.hostKey,
      roomName: req.body.roomName,
    });
    ApiResponse.ok(data, "Room renamed successfully").send(res)
  }

  async closeRoom(req, res) {
    const data = await roomService.closeRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
      hostKey: req.body.hostKey,
    });

    ApiResponse.ok(data, "Room closed successfully").send(res)
  }

  async lockRoom(req, res) {
    const data = await roomService.lockRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
      hostKey: req.body.hostKey,
    });

    ApiResponse.ok(data, "Room lock successfully").send(res)
  }

  async unlockRoom(req, res) {
    const data = await roomService.unlockRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
      hostKey: req.body.hostKey,
    });

    ApiResponse.ok(data, 'Room Unlocked successfully').send(res)
  }

  async removeParticipant(req, res) {
    const data = await roomService.removeParticipant({
      roomCode: req.params.roomCode,
      participantId: req.params.participantId,
      hostParticipantId: req.body.hostParticipantId,
      hostKey: req.body.hostKey,
    });

    ApiResponse.ok(data, 'Participant removed successfully').send(res)
  }
}

export default new RoomController();

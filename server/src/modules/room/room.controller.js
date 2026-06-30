import roomService from "./room.service.js";
import ApiResponse from "../../shared/utils/ApiResponse.js";

class RoomController {
  async createRoom(req, res) {
    const data = await roomService.createRoom(req.body);
    ApiResponse.created(data, "Room created successfully").send(res);
  }

  async joinRoom(req, res) {
    const data = await roomService.joinRoom(req.body);
    ApiResponse.ok(data, "Room join successfully").send(res);
  }

  async renameRoom(req, res) {
    const data = await roomService.renameRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
      roomName: req.body.roomName,
    });

    ApiResponse.ok(data, "Rename room name successfully").send(res);
  }

  async closeRoom(req, res) {
    const data = await roomService.closeRoom({
      roomCode: req.params.roomCode,
      participantId: req.body.participantId,
    });

    ApiResponse.ok(data, "Room close successfully").send(res);
  }

  async getRoom(req, res) {
    const data = await roomService.getRoom(req.params.roomCode);

    ApiResponse.ok(data, "Room fetch successfully").send(res);
  }
}

export default new RoomController();

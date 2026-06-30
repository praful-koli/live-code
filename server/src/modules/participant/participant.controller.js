import ApiResponse from "../../shared/utils/ApiResponse.js";
import participantService from "./participant.service.js";

class ParticipantController {
  async getRoomParticipants(req, res) {
    const data = await participantService.getRoomParticipants(
      req.params.roomCode
    );
    ApiResponse.ok(data, 'Success').send(res)
  }
}

export default new ParticipantController();
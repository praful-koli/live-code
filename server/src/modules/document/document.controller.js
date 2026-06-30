import ApiResponse from "../../shared/utils/ApiResponse.js";
import documentService from "./document.service.js";

class DocumentController {
  async getDocument(req, res) {
    const data = await documentService.getDocumentByRoomCode(
      req.params.roomCode
    );

    ApiResponse.ok(data, "Document fetched successfully").send(res);
  }
}

export default new DocumentController();

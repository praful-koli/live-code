import Document from "./document.model.js";

class DocumentRepository {
  async create({ roomId }) {
    return Document.create({ roomId, content: "", version: 0, operationLog: [] });
  }

  async findByRoomId(roomId) {
    return Document.findOne({ roomId });
  }

  async updateDocument(roomId, { content, version, operation }) {
    return Document.findOneAndUpdate(
      { roomId },
      {
        $set: { content, version },
        $push: { operationLog: operation },
      },
      { new: true }
    );
  }

  async trimOperationLog(roomId, keepCount = 100) {
    const doc = await Document.findOne({ roomId });
    if (!doc) return null;

    if (doc.operationLog.length > keepCount) {
      doc.operationLog = doc.operationLog.slice(-keepCount);
      await doc.save();
    }

    return doc;
  }
}

export default new DocumentRepository();

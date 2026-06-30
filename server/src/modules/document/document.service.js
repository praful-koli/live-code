import documentRepository from "./document.repository.js";
import roomRepository from "../room/room.repository.js";
import ApiError from "../../shared/error/ApiError.js";
import logger from "../../config/logger.js";

class DocumentService {
  /**
   * Get or lazily create a document for a room.
   * Ensures every room always has an associated document.
   */
  async getOrCreateDocument(roomId) {
    let doc = await documentRepository.findByRoomId(roomId);

    if (!doc) {
      doc = await documentRepository.create({ roomId });
      logger.info({ roomId }, "Lazily created document for room");
    }

    return doc;
  }

  /**
   * Get document by room code (for REST endpoint).
   * Returns { content, version } so a joining client can initialize.
   */
  async getDocumentByRoomCode(roomCode) {
    const room = await roomRepository.findByRoomCode(roomCode);

    if (!room) {
      throw ApiError.notFound("Room not found");
    }

    const doc = await this.getOrCreateDocument(room._id);

    return {
      content: doc.content,
      version: doc.version,
    };
  }

  /**
   * CORE SYNC ENGINE — Apply a delta with position-shift transform.
   *
   * Delta format from client:
   * {
   *   type: "insert" | "delete",
   *   position: number,        // cursor position in the document
   *   text: string,            // text to insert (for insert) or text that was deleted (for delete)
   *   version: number,         // client's last known server version
   *   participantId: string,
   *   participantName: string
   * }
   *
   * Returns: { transformedDelta, newVersion, content } for broadcasting
   */
  async applyDelta(roomId, delta) {
    const doc = await this.getOrCreateDocument(roomId);

    // --- Step 1: Transform position against missed operations ---
    const transformedPosition = this.transformPosition(
      delta.position,
      delta.version,
      doc.operationLog,
      delta.participantId
    );

    // --- Step 2: Apply the transformed delta to the document content ---
    let newContent = doc.content;
    let operationLength = 0;

    if (delta.type === "insert") {
      // Clamp position to valid range
      const pos = Math.min(Math.max(0, transformedPosition), newContent.length);
      newContent =
        newContent.slice(0, pos) + delta.text + newContent.slice(pos);
      operationLength = delta.text.length;
    } else if (delta.type === "delete") {
      const pos = Math.min(Math.max(0, transformedPosition), newContent.length);
      const deleteLength = delta.text.length || 1;
      // Clamp delete to not go past end of document
      const actualDeleteLength = Math.min(deleteLength, newContent.length - pos);
      if (actualDeleteLength > 0) {
        newContent =
          newContent.slice(0, pos) + newContent.slice(pos + actualDeleteLength);
        operationLength = actualDeleteLength;
      }
    }

    // --- Step 3: Build the operation record ---
    const newVersion = doc.version + 1;
    const operation = {
      type: delta.type,
      position: transformedPosition,
      text: delta.text,
      length: operationLength,
      version: newVersion,
      participantId: delta.participantId,
      participantName: delta.participantName || "Unknown",
      timestamp: new Date(),
    };

    // --- Step 4: Persist to MongoDB ---
    await documentRepository.updateDocument(doc.roomId, {
      content: newContent,
      version: newVersion,
      operation,
    });

    // --- Step 5: Periodically trim operation log ---
    if (newVersion % 50 === 0) {
      await documentRepository.trimOperationLog(doc.roomId, 100);
    }

    // --- Step 6: Return the transformed delta for broadcasting ---
    return {
      transformedDelta: {
        type: delta.type,
        position: transformedPosition,
        text: delta.text,
        length: operationLength,
        participantId: delta.participantId,
        participantName: delta.participantName || "Unknown",
      },
      newVersion,
      content: newContent,
    };
  }

  /**
   * POSITION-SHIFT TRANSFORM
   *
   * Given a position from a client at a certain version, transform it
   * against all operations that happened since that version.
   *
   * Rules:
   * - Skip operations from the same participant (they already accounted for their own edits)
   * - For each missed operation:
   *   - If it was an INSERT at pos <= our position → shift right by insert length
   *   - If it was a DELETE at pos < our position → shift left by delete length (clamped to 0)
   */
  transformPosition(position, clientVersion, operationLog, participantId) {
    // Find all operations that happened after the client's version
    const missedOps = operationLog.filter(
      (op) => op.version > clientVersion && op.participantId !== participantId
    );

    // Sort by version ascending to apply transforms in order
    missedOps.sort((a, b) => a.version - b.version);

    let transformedPos = position;

    for (const op of missedOps) {
      if (op.type === "insert") {
        // A remote insert happened at or before our position → shift right
        if (op.position <= transformedPos) {
          transformedPos += op.length;
        }
        // If insert happened after our position → no shift needed
      } else if (op.type === "delete") {
        if (op.position < transformedPos) {
          // Remote delete started before our position
          const deleteEnd = op.position + op.length;

          if (deleteEnd <= transformedPos) {
            // Entire delete was before our position → shift left by delete length
            transformedPos -= op.length;
          } else {
            // Delete overlaps our position → collapse to the delete start
            transformedPos = op.position;
          }
        }
        // If delete started at or after our position → no shift needed
      }
    }

    // Clamp to >= 0
    return Math.max(0, transformedPos);
  }
}

export default new DocumentService();

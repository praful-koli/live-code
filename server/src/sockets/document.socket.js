import documentService from "../modules/document/document.service.js";
import roomRepository from "../modules/room/room.repository.js";
import logger from "../config/logger.js";

export const documentSocket = (io, socket) => {
  /**
   * doc:load — Client requests the current document when joining a room.
   * Payload: { roomCode }
   * Response: { content, version }
   */
  socket.on("doc:load", async ({ roomCode }) => {
    try {
      if (!roomCode) {
        socket.emit("socket:error", {
          message: "roomCode is required for doc:load",
        });
        return;
      }

      const room = await roomRepository.findByRoomCode(roomCode);
      if (!room) {
        socket.emit("socket:error", { message: "Room not found" });
        return;
      }

      const doc = await documentService.getOrCreateDocument(room._id);

      socket.emit("doc:load", {
        content: doc.content,
        version: doc.version,
      });

      logger.info(
        { roomCode, version: doc.version },
        "Document loaded for client"
      );
    } catch (error) {
      logger.error({ error: error.message }, "doc:load error");
      socket.emit("socket:error", { message: error.message });
    }
  });

  /**
   * doc:delta — Client sends an edit delta.
   *
   * Payload: {
   *   roomCode: string,
   *   delta: {
   *     type: "insert" | "delete",
   *     position: number,
   *     text: string,
   *     version: number,          // client's last known server version
   *     participantId: string,
   *     participantName: string
   *   }
   * }
   *
   * Server:
   *   1. Transforms the delta position against missed operations
   *   2. Applies to the authoritative document
   *   3. Sends doc:ack to the sender with the new version
   *   4. Broadcasts doc:delta to all OTHER clients in the room with the transformed delta
   */
  socket.on("doc:delta", async ({ roomCode, delta }) => {
    try {
      if (!roomCode || !delta) {
        socket.emit("socket:error", {
          message: "roomCode and delta are required",
        });
        return;
      }

      // Validate delta structure
      if (!delta.type || delta.position === undefined || delta.text === undefined) {
        socket.emit("socket:error", {
          message: "Invalid delta: type, position, and text are required",
        });
        return;
      }

      if (!["insert", "delete"].includes(delta.type)) {
        socket.emit("socket:error", {
          message: 'Invalid delta type: must be "insert" or "delete"',
        });
        return;
      }

      const room = await roomRepository.findByRoomCode(roomCode);
      if (!room) {
        socket.emit("socket:error", { message: "Room not found" });
        return;
      }

      // Apply the delta through the sync engine
      const result = await documentService.applyDelta(room._id, {
        type: delta.type,
        position: delta.position,
        text: delta.text,
        version: delta.version || 0,
        participantId: delta.participantId || socket.participantId || "unknown",
        participantName: delta.participantName || "Unknown",
      });

      // Acknowledge the sender with the new version
      socket.emit("doc:ack", {
        version: result.newVersion,
      });

      // Broadcast the transformed delta to all OTHER clients in the room
      socket.to(roomCode).emit("doc:delta", {
        delta: result.transformedDelta,
        version: result.newVersion,
      });
    } catch (error) {
      logger.error({ error: error.message, roomCode }, "doc:delta error");
      socket.emit("socket:error", { message: error.message });
    }
  });

  /**
   * doc:sync — Client requests a full document resync.
   * Used when a client detects it's too far behind or in an inconsistent state.
   * Payload: { roomCode }
   * Response: { content, version }
   */
  socket.on("doc:sync", async ({ roomCode }) => {
    try {
      if (!roomCode) {
        socket.emit("socket:error", {
          message: "roomCode is required for doc:sync",
        });
        return;
      }

      const room = await roomRepository.findByRoomCode(roomCode);
      if (!room) {
        socket.emit("socket:error", { message: "Room not found" });
        return;
      }

      const doc = await documentService.getOrCreateDocument(room._id);

      socket.emit("doc:sync", {
        content: doc.content,
        version: doc.version,
      });

      logger.info(
        { roomCode, version: doc.version },
        "Full document resync sent to client"
      );
    } catch (error) {
      logger.error({ error: error.message }, "doc:sync error");
      socket.emit("socket:error", { message: error.message });
    }
  });

  /**
   * doc:cursor — Client broadcasts their cursor position.
   * This is a lightweight relay — server doesn't persist cursor positions.
   * Payload: { roomCode, cursor: { participantId, participantName, position, selectionStart, selectionEnd } }
   */
  socket.on("doc:cursor", ({ roomCode, cursor }) => {
    if (!roomCode || !cursor) return;

    socket.to(roomCode).emit("doc:cursor", { cursor });
  });
};

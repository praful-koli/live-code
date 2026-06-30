import participantService from "../modules/participant/participant.service.js";

export const roomSocket = (io, socket) => {
  socket.on("room:join", async ({ roomCode, participantId }) => {
    console.log("room:join")
    try {
      if (!roomCode || !participantId) {
        socket.emit("socket:error", {
          message: "roomCode and participantId are required",
        });
        return;
      }

      socket.join(roomCode);

      socket.roomCode = roomCode;
      socket.participantId = participantId;

      await participantService.updateSocket(participantId, socket.id);

      const participants =
        await participantService.getRoomParticipants(roomCode);
      console.log("Sending participant:list",participants);
      io.to(roomCode).emit("participant:list", participants);

      socket.to(roomCode).emit("participant:joined", {
        participantId,
        message: "A participant joined the room",
      });
    } catch (error) {
      socket.emit("socket:error", {
        message: error.message,
      });
    }
  });

  socket.on("room:leave", async () => {
    try {
      const { roomCode, participantId } = socket;

      if (!roomCode || !participantId) return;

      await participantService.markOffline(participantId);

      const participants =
        await participantService.getRoomParticipants(roomCode);

      socket.leave(roomCode);

      io.to(roomCode).emit("participant:list", participants);

      socket.to(roomCode).emit("participant:left", {
        participantId,
        message: "A participant left the room",
      });
    } catch (error) {
      socket.emit("socket:error", {
        message: error.message,
      });
    }
  });

  socket.on("disconnect", async () => {
    try {
      const { roomCode, participantId } = socket;

      if (!roomCode || !participantId) return;

      await participantService.markOffline(participantId);

      const participants =
        await participantService.getRoomParticipants(roomCode);

      io.to(roomCode).emit("participant:list", participants);

      console.log("Socket disconnected:", socket.id);
    } catch (error) {
      console.log("Disconnect error:", error.message);
    }
  });
};

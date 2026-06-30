import participantService from "../modules/participant/participant.service.js";

export const roomSocket = (io, socket) => {
  socket.on("room:join", async ({ roomCode, participantId }) => {
    console.log("room:join");

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

      const joinedParticipant = await participantService.updateSocket(
        participantId,
        socket.id,
      );

      const participants =
        await participantService.getRoomParticipants(roomCode);

      console.log("Sending participant:list", participants);

      io.to(roomCode).emit("participant:list", participants);

      socket.to(roomCode).emit("participant:joined", {
        participantId: joinedParticipant._id,
        name: joinedParticipant.name,
        isHost: joinedParticipant.isHost,
        message: `${joinedParticipant.name} joined the room`,
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

      const leftParticipant =
        await participantService.markOffline(participantId);

      const participants =
        await participantService.getRoomParticipants(roomCode);

      socket.leave(roomCode);

      io.to(roomCode).emit("participant:list", participants);

      socket.to(roomCode).emit("participant:left", {
        participantId: leftParticipant._id,
        name: leftParticipant.name,
        isHost: leftParticipant.isHost,
        message: `${leftParticipant.name} left the room`,
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

      const disconnectedParticipant =
        await participantService.markOffline(participantId);

      const participants =
        await participantService.getRoomParticipants(roomCode);

      io.to(roomCode).emit("participant:list", participants);

      socket.to(roomCode).emit("participant:left", {
        participantId: disconnectedParticipant._id,
        name: disconnectedParticipant.name,
        isHost: disconnectedParticipant.isHost,
        message: `${disconnectedParticipant.name} disconnected`,
      });

      console.log("Socket disconnected:", socket.id);
    } catch (error) {
      console.log("Disconnect error:", error.message);
    }
  });
};

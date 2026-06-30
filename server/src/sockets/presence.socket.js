export const presenceSocket = (io, socket) => {
  socket.on("presence:typing", ({ roomCode, participant }) => {
    if (!roomCode || !participant) return;

    socket.to(roomCode).emit("presence:typing", {
      participant,
      message: `${participant.name} is typing...`,
    });
  });

  socket.on("presence:stop-typing", ({ roomCode, participant }) => {
    if (!roomCode || !participant) return;

    socket.to(roomCode).emit("presence:stop-typing", {
      participant,
    });
  });

  socket.on("presence:active-editor", ({ roomCode, participant }) => {
    if (!roomCode || !participant) return;

    socket.to(roomCode).emit("presence:active-editor", {
      participant,
      message: `${participant.name} is editing`,
    });
  });
};
import { roomSocket } from "./room.socket.js";
import { presenceSocket } from "./presence.socket.js";

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    roomSocket(io, socket);
    presenceSocket(io, socket);
  });
};
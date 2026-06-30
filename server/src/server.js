import createApp from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import logger from "./config/logger.js";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./realtime/socketHandlers.js";

const app = createApp();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

async function startServer() {
  connectDB()
    .then(() => {
      io.on("connection", (socket) => {
        console.log("New connection:", socket.id);
        registerSocketHandlers(io, socket);
      });

      httpServer.listen(config.PORT, () => {
        logger.info(
          { port: config.PORT },
          `\x1b[46mServer started on port\x1b[0m`,
        );
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}

startServer();

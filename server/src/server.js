import createApp from "./app.js";
import env from "./config/config.js";
import logger from "./config/logger.js";
import connectDB from "./config/database.js";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/index.socket.js";

const app = createApp();

const httpServer = http.createServer(app);

const origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];
if (env.CLIENT_URL) origins.push(env.CLIENT_URL);
if (env.CLIENT_URL_PROD) origins.push(env.CLIENT_URL_PROD);

const io = new Server(httpServer, {
  cors: {
    origin: origins,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  },
});

app.set("io", io);

initializeSocket(io);

function startServer() {
  connectDB()
    .then(() => {
      httpServer.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, "server running");
      });
    })
    .catch((err) => {
      logger.error({ error: err }, "error while running server");
    });
}

startServer();

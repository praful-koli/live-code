import createApp from "./app.js";
import env from "./config/config.js";
import logger from "./config/logger.js";
import connectDB from "./config/database.js";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/index.socket.js";

const app = createApp();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        env.CLIENT_URL,
        env.CLIENT_URL_PROD,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ].filter(Boolean);

      const isLocalhost = origin && /^https?:\/\/localhost(:\d+)?$/.test(origin);
      const isVercel = origin && /^https:\/\/live-code-.*\.vercel\.app$/.test(origin);
      const isVercelShort = origin && origin === "https://live-code.vercel.app";

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalhost ||
        isVercel ||
        isVercelShort ||
        env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        logger.warn(`Socket CORS blocked for origin: ${origin}`);
        callback(null, false);
      }
    },
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

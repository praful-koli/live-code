import createApp from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import logger from "./config/logger.js";

const app = createApp();

async function startServer() {
	connectDB()
		.then(() => {
			app.listen(config.PORT, () => {
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

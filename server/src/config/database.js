import dns from "node:dns";
import mongoose from "mongoose";
import config from "./config.js";
import logger from "./logger.js";

// Force Node to use Google DNS so Atlas SRV lookups work on all networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
	if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
		logger.warn("⚠️ CRITICAL: Neither MONGO_URI nor MONGODB_URI environment variables are set. Falling back to localhost.");
	} else {
		logger.info(`🔌 Connecting to MongoDB host: ${config.MONGO_URI ? config.MONGO_URI.split("@").pop().split("/")[0] : "undefined"}`);
	}
	await mongoose.connect(config.MONGO_URI);
	logger.info("\x1b[42mDatabase connected\x1b[0m");
};

export default connectDB;

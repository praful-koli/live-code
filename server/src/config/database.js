import dns from "node:dns";
import mongoose from "mongoose";
import config from "./config.js";
import logger from "./logger.js";

// Force Node to use Google DNS so Atlas SRV lookups work on all networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
	await mongoose.connect(config.MONGO_URI);
	logger.info("\x1b[42mDatabase connected\x1b[0m");
};

export default connectDB;

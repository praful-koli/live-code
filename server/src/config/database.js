import mongoose from "mongoose";
import config from "./config.js";
import logger from "./logger.js";

const connectDB = async () => {
	await mongoose.connect(config.MONGO_URI);
	logger.info("\x1b[42mDatabase connected\x1b[0m");
};

export default connectDB;

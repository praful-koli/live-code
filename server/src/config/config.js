import dotenv from "dotenv";
import constants from "../constants/app.constant.js";

dotenv.config({ quiet: true });

const OAuthStatus = process.env.GOOGLE_OAUTH_STATUS === "enable";

const config = {
	PORT: Number(process.env.PORT) || constants.PORT,
	MONGO_URI: process.env.MONGO_URI || constants.MONGO_URI,
	JWT_SECRET_ACCESS: process.env.JWT_SECRET_ACCESS,
	JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH,
	CLIENT_URL: process.env.CLIENT_URL || "",
	CLIENT_URL_PROD: process.env.CLIENT_URL_PROD || "",
	NODE_ENV: process.env.NODE_ENV,
	LOGGER_LEVEL: constants.LOGGER_LEVEL,
};

export default config;

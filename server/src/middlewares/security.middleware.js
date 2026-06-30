import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import config from "../config/config.js";

const SecurityMiddleware = (app) => {
	app.use(express.json());
	app.use(cookieParser());
	app.use(express.urlencoded({ extended: true }));
	if (config.NODE_ENV === "development") {
		app.use(morgan("dev"));
	}
	const allowedOrigins = [
		config.CLIENT_URL,
		config.CLIENT_URL_PROD,
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:3000",
	].filter(Boolean);

	app.use(
		cors({
			origin: (origin, callback) => {
				const isLocalhost = origin && /^https?:\/\/localhost(:\d+)?$/.test(origin);
				const isVercel = origin && /^https:\/\/live-code-.*\.vercel\.app$/.test(origin);
				const isVercelShort = origin && origin === "https://live-code.vercel.app";

				if (
					!origin ||
					allowedOrigins.includes(origin) ||
					isLocalhost ||
					isVercel ||
					isVercelShort ||
					config.NODE_ENV !== "production"
				) {
					callback(null, true);
				} else {
					logger.warn(`CORS blocked for origin: ${origin}`);
					callback(null, false);
				}
			},
			credentials: true,
		}),
	);
	
};

export default SecurityMiddleware;


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
				if (!origin || allowedOrigins.includes(origin) || config.NODE_ENV !== "production") {
					callback(null, true);
				} else {
					callback(new Error("Not allowed by CORS"));
				}
			},
			credentials: true,
		}),
	);
	
};

export default SecurityMiddleware;

import express from "express";
import ErrorMiddleware from "./middlewares/error.middleware.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import indexRoutes from "./routes/index.route.js";

const createApp = () => {
	const app = express();

	securityMiddleware(app);

	app.get("/", (_, res) => {
		res.send("Backend is running!!!");
	});
	app.use("/api/v1", indexRoutes);
	app.use(ErrorMiddleware);

	return app;
};

export default createApp;

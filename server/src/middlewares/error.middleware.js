import { StatusCodes } from "http-status-codes";
import logger from "../config/logger.js";

const ErrorMiddleware = (err, _, res, __) => {
	if (err.statusCode >= 500) {
		logger.error({
			message: err.message,
			stack: err.stack,
			statusCode: err.statusCode,
		});
	}
	return res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
		message: err.message || "Internal Server Error",
		success: false,
	});
};

export default ErrorMiddleware;

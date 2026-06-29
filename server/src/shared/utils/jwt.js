import jwt from "jsonwebtoken";
import config from "../../config/config.js";

export const decodeAccessToken = (token) => {
	return jwt.verify(token, config.JWT_SECRET_ACCESS);
};

export const decodeRefreshToken = (token) => {
	return jwt.verify(token, config.JWT_SECRET_REFRESH);
};

import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../../config/config.js";
import tokenConstant from "../../constants/token.constant.js";

export const generateAccessToken = (payload) => {
	return jwt.sign(payload, config.JWT_SECRET_ACCESS, tokenConstant.access);
};

export const generateRefreshToken = (payload) => {
	return jwt.sign(payload, config.JWT_SECRET_REFRESH, tokenConstant.refresh);
};

export const hashToken = (token) => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

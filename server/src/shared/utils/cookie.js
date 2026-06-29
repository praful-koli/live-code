import config from "../../config/config.js";

export const setAccessCookie = (res, token) => {
	res.cookie("accessToken", token, {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: config.NODE_ENV === "production" ? "none" : "lax",
		maxAge: config.NODE_ENV === "production" ? 15 * 60 * 1000 : 15 * 1000, //15min, 15secs
	});
};
export const setRefreshCookie = (res, token) => {
	res.cookie("refreshToken", token, {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: config.NODE_ENV === "production" ? "none" : "lax",
		maxAge:
			config.NODE_ENV === "production"
				? 7 * 24 * 60 * 60 * 1000 //7days
				: 15 * 60 * 1000, //15mins
	});
};

export const clearRefreshCookie = (res) => {
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: config.NODE_ENV === "production" ? "none" : "lax",
	});
};

export const clearAccessCookie = (res) => {
	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: config.NODE_ENV === "production" ? "none" : "lax",
	});
};

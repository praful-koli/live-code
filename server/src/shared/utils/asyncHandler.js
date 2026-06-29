const AsyncHandler = (handler) => {
	return async (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch((error) => next(error));
	};
};

export default AsyncHandler;

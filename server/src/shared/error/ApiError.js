import {
  HTTP_MESSAGES,
  HTTP_STATUS,
} from "../../constants/http.constants.js";

class ApiError extends Error {
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = HTTP_MESSAGES.INTERNAL_SERVER_ERROR,
    errors = [],
    isOperational = true,
    options = {}
  ) {
    const { cause, code, stack } = options ?? {};

    super(message, cause ? { cause } : undefined);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.success = false;
    this.errors = Array.isArray(errors) ? errors : [];
    this.isOperational = isOperational;

    if (code !== undefined) this.code = code;
    if (cause !== undefined) this.cause = cause;

    if (stack) {
      this.stack = stack;
    } else if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack ?? "";
    }
  }

  static from(error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    if (!error) return new ApiError(statusCode);
    if (error instanceof ApiError) return error;

    const message = error instanceof Error ? error.message : String(error);

    return new ApiError(statusCode, message, error.errors ?? [], false, {
      cause: error,
      code: error instanceof Error ? error.code : undefined,
    });
  }

  // 400
  static badRequest(message = HTTP_MESSAGES.BAD_REQUEST, errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  // 401
  static unauthorized(message = HTTP_MESSAGES.UNAUTHORIZED, errors = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  // 403
  static forbidden(message = HTTP_MESSAGES.FORBIDDEN, errors = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  // 404
  static notFound(message = HTTP_MESSAGES.NOT_FOUND, errors = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  // 409
  static conflict(message = HTTP_MESSAGES.CONFLICT, errors = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  // 410
  static gone(message = HTTP_MESSAGES.GONE ?? "Gone", errors = []) {
    return new ApiError(HTTP_STATUS.GONE ?? 410, message, errors);
  }

  // 422
  static validationError(
    message = HTTP_MESSAGES.VALIDATION_ERROR,
    errors = []
  ) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  // 429
  static tooManyRequests(
    message = HTTP_MESSAGES.TOO_MANY_REQUESTS,
    errors = []
  ) {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, errors);
  }

  // 500
  static internalServerError(
    message = HTTP_MESSAGES.INTERNAL_SERVER_ERROR,
    errors = []
  ) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors);
  }

  // 501
  static notImplemented(message = HTTP_MESSAGES.NOT_IMPLEMENTED, errors = []) {
    return new ApiError(HTTP_STATUS.NOT_IMPLEMENTED, message, errors);
  }

  // 502
  static badGateway(message = HTTP_MESSAGES.BAD_GATEWAY, errors = []) {
    return new ApiError(HTTP_STATUS.BAD_GATEWAY, message, errors);
  }

  // 503
  static serviceUnavailable(
    message = HTTP_MESSAGES.SERVICE_UNAVAILABLE,
    errors = []
  ) {
    return new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, message, errors);
  }

  // 504
  static gatewayTimeout(message = HTTP_MESSAGES.GATEWAY_TIMEOUT, errors = []) {
    return new ApiError(HTTP_STATUS.GATEWAY_TIMEOUT, message, errors);
  }

  toJSON() {
    return {
      name: this.name,
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      ...(this.code !== undefined && { code: this.code }),
    };
  }

  toDebugJSON() {
    return {
      ...this.toJSON(),
      isOperational: this.isOperational,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? { message: this.cause.message, stack: this.cause.stack }
          : this.cause,
    };
  }

  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  isServerError() {
    return this.statusCode >= 500;
  }
}

export default ApiError;

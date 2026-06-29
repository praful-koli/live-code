import {
  HTTP_MESSAGES,
  HTTP_STATUS,
} from "../../constants/http.constants.js";

class ApiResponse {
  constructor(
    statusCode = HTTP_STATUS.OK,
    data = null,
    message = HTTP_MESSAGES.OK ?? "Success",
    meta
  ) {
    if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
      throw new TypeError(`Invalid HTTP status code: ${statusCode}`);
    }

    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message =
      typeof message === "string" && message.trim()
        ? message.trim()
        : "Success";
    this.data = data !== undefined ? data : null;
    this.timestamp = new Date().toISOString();

    if (
      meta !== null &&
      meta !== undefined &&
      typeof meta === "object" &&
      !Array.isArray(meta)
    ) {
      this.meta = meta;
    }
  }

  static ok(data, message = HTTP_MESSAGES.OK ?? "OK") {
    return new ApiResponse(HTTP_STATUS.OK, data, message);
  }

  static created(data, message = HTTP_MESSAGES.CREATED ?? "Created") {
    return new ApiResponse(HTTP_STATUS.CREATED, data, message);
  }

  static accepted(data, message = HTTP_MESSAGES.ACCEPTED ?? "Accepted") {
    return new ApiResponse(HTTP_STATUS.ACCEPTED, data, message);
  }

  static noContent(message = HTTP_MESSAGES.NO_CONTENT ?? "No Content") {
    return new ApiResponse(HTTP_STATUS.NO_CONTENT, null, message);
  }

  static paginated(
    items,
    { page, limit, total },
    message = HTTP_MESSAGES.OK ?? "OK"
  ) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new TypeError(
        `Pagination "limit" must be a positive integer, got: ${limit}`
      );
    if (!Number.isInteger(page) || page < 1)
      throw new TypeError(
        `Pagination "page" must be a positive integer, got: ${page}`
      );
    if (!Number.isInteger(total) || total < 0)
      throw new TypeError(
        `Pagination "total" must be a non-negative integer, got: ${total}`
      );

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return new ApiResponse(HTTP_STATUS.OK, items, message, meta);
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      ...(this.meta !== undefined && { meta: this.meta }),
      timestamp: this.timestamp,
    };
  }

  send(res) {
    if (this.statusCode === HTTP_STATUS.NO_CONTENT) {
      return res.status(this.statusCode).end();
    }

    return res.status(this.statusCode).json(this.toJSON());
  }

  static redirect(res, url, statusCode = HTTP_STATUS.FOUND) {
    if (!Number.isInteger(statusCode) || statusCode < 300 || statusCode > 399) {
      throw new TypeError(`Invalid HTTP redirect status code: ${statusCode}`);
    }

    return res.redirect(statusCode, url);
  }
}

export default ApiResponse;

const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
});

const HTTP_STATUS = Object.freeze({
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,

  // Redirection (Optional but good to have)
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
});

const HTTP_MESSAGES = Object.freeze({
  // Success
  OK: "Success",
  CREATED: "Resource created successfully",
  ACCEPTED: "Request accepted",
  NO_CONTENT: "No content",
  PARTIAL_CONTENT: "Partial content",

  // Redirection
  MOVED_PERMANENTLY: "Moved permanently",
  FOUND: "Found",
  NOT_MODIFIED: "Not modified",
  TEMPORARY_REDIRECT: "Temporary redirect",
  PERMANENT_REDIRECT: "Permanent redirect",

  // Client Errors
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  METHOD_NOT_ALLOWED: "Method not allowed",
  NOT_ACCEPTABLE: "Not acceptable",
  REQUEST_TIMEOUT: "Request timeout",
  CONFLICT: "Resource already exists",
  GONE: "Resource no longer available",
  PAYLOAD_TOO_LARGE: "Payload too large",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported media type",
  UNPROCESSABLE_ENTITY: "Unprocessable entity",
  VALIDATION_ERROR: "Validation error",
  TOO_MANY_REQUESTS: "Too many requests",

  // Server Errors
  INTERNAL_SERVER_ERROR: "Internal server error",
  NOT_IMPLEMENTED: "Not implemented",
  BAD_GATEWAY: "Bad gateway",
  SERVICE_UNAVAILABLE: "Service unavailable",
  GATEWAY_TIMEOUT: "Gateway timeout",
  HTTP_VERSION_NOT_SUPPORTED: "HTTP version not supported",
});

export { HTTP_MESSAGES, HTTP_METHODS, HTTP_STATUS };

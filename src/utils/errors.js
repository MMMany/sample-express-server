"use strict";

// base class
class HttpBaseError extends Error {
  constructor(message) {
    super(message ?? "unknown");
    this.name = this.constructor.name;
    this.status = -1;
  }
}

module.exports = {
  // 200 ~ 299
  NoContentError: class NoContentError extends HttpBaseError {
    constructor(message) {
      super(message ?? "No Content");
      this.status = 204;
    }
  },

  // 400 ~ 499
  BadRequestError: class BadRequestError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Bad Request");
      this.status = 400;
    }
  },

  UnauthorizedError: class UnauthorizedError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Unauthorized");
      this.status = 401;
    }
  },

  ForbiddenError: class ForbiddenError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Forbidden");
      this.status = 403;
    }
  },

  NotFoundError: class NotFoundError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Not Found");
      this.status = 404;
    }
  },

  RequestTimeoutError: class RequestTimeoutError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Request Timeout");
      this.status = 408;
    }
  },

  // 500 ~ 599
  InternalServerError: class InternalServerError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Internal Server Error");
      this.status = 500;
    }
  },

  NotImplementedError: class NotImplementedError extends HttpBaseError {
    constructor(message) {
      super(message ?? "Not Implemented");
      this.status = 501;
    }
  },
};

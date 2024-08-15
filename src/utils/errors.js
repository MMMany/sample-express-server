"use strict";

// 400 ~ 499
class BadRequestError extends Error {
  constructor(message) {
    super(message ?? "Bad Request");
    this.name = "BadRequestError";
    this.status = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message ?? "Unauthorized");
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message ?? "Forbidden");
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message ?? "Not Found");
    this.name = "NotFoundError";
    this.status = 404;
  }
}

class RequestTimeoutError extends Error {
  constructor(message) {
    super(message ?? "Request Timeout");
    this.name = "RequestTimeoutError";
    this.status = 408;
  }
}

// 500 ~ 599
class InternalServerError extends Error {
  constructor(message) {
    super(message ?? "Internal Server Error");
    this.name = "InternalServerError";
    this.status = 500;
  }
}

class NotImplementedError extends Error {
  constructor(message) {
    super(message ?? "Not Implemented");
    this.name = "NotImplementedError";
    this.status = 501;
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RequestTimeoutError,
  InternalServerError,
  NotImplementedError,
};

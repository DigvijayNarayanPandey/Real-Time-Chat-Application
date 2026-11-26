import { logger } from "../lib/logger.js";

/**
 * Represents a known operational error whose message is safe to return to clients.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
  }
}

/**
 * Wraps async route/controller handlers so rejected promises reach errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles unknown /api/* routes with a consistent 404 JSON response.
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Centralized Express error-handling middleware distinguishing operational and unexpected errors.
 */
export const errorHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof AppError || err?.isOperational) {
    statusCode = err.statusCode || 500;
    message = err.message;
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ") || "Validation failed";
  } else if (err?.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyPattern || {})[0];
    message = duplicateField === "email" ? "Email already exists" : "Duplicate value error";
  } else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON payload";
  } else if (err?.type === "entity.too.large") {
    statusCode = 413;
    message = "Request payload is too large";
  } else if (typeof err?.message === "string" && err.message.startsWith("CORS blocked")) {
    statusCode = 403;
    message = err.message;
  }

  const logMeta = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?._id?.toString(),
  };

  if (statusCode >= 500) {
    logger.error(err?.message || "Unhandled server error", { ...logMeta, error: err });
  } else {
    logger.warn(message, logMeta);
  }

  res.status(statusCode).json({ message });
};

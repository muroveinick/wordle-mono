import { ErrorCode, ErrorResponse, ValidationErrorDetail, ValidationErrorResponse } from "@types";
import { NextFunction, Request, Response } from "express";
import { DuplicateKeyErrorResponse, ERROR_DESCRIPTIONS, ERROR_HTTP_STATUS, RateLimitErrorResponse } from "../types/errorTypes";
import logger from "./logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: ErrorCode;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  code: ErrorCode;

  constructor(code: ErrorCode, message?: string, statusCode?: number) {
    super(message || ERROR_DESCRIPTIONS[code]);
    this.code = code;
    this.statusCode = statusCode || ERROR_HTTP_STATUS[code];
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

function createErrorResponse(code: ErrorCode, req: Request, details?: any, stack?: string, description?: string): ErrorResponse {
  return {
    code,
    description: description || ERROR_DESCRIPTIONS[code],
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    details,
    ...(process.env.NODE_ENV === "development" && stack && { stack }),
    requestId: (req.headers["x-request-id"] as string) || "unknown",
  };
}

// Global error handler middleware
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const code = err.code || ErrorCode.INTERNAL_SERVER_ERROR;
  const statusCode = err.statusCode || ERROR_HTTP_STATUS[code];

  // Log error
  logger.error("Error occurred", {
    error: err.message,
    code,
    stack: err.stack,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestId: req.headers["x-request-id"] || "unknown",
  });

  const errorResponse = createErrorResponse(code, req, undefined, err.stack, err.message);

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(ErrorCode.ENDPOINT_NOT_FOUND, `Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const validationErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === "ValidationError") {
    const errors: ValidationErrorDetail[] = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));

    logger.warn("Validation error", {
      errors,
      method: req.method,
      url: req.url,
      requestId: req.headers["x-request-id"] || "unknown",
    });

    const errorResponse: ValidationErrorResponse = {
      ...createErrorResponse(ErrorCode.VALIDATION_ERROR, req, errors),
      code: ErrorCode.VALIDATION_ERROR,
      details: errors,
    };

    return res.status(ERROR_HTTP_STATUS[ErrorCode.VALIDATION_ERROR]).json(errorResponse);
  }

  next(err);
};

// MongoDB duplicate key error handler
export const duplicateKeyErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    logger.warn("Duplicate key error", {
      field,
      value,
      method: req.method,
      url: req.url,
      requestId: req.headers["x-request-id"] || "unknown",
    });

    const errorResponse: DuplicateKeyErrorResponse = {
      ...createErrorResponse(ErrorCode.DUPLICATE_RESOURCE, req, { field, value }),
      code: ErrorCode.DUPLICATE_RESOURCE,
      details: { field, value },
    };

    return res.status(ERROR_HTTP_STATUS[ErrorCode.DUPLICATE_RESOURCE]).json(errorResponse);
  }

  next(err);
};

// Rate limiting error handler
export const rateLimitErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.status === 429) {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.headers["x-request-id"] || "unknown",
    });

    const errorResponse: RateLimitErrorResponse = {
      ...createErrorResponse(ErrorCode.RATE_LIMIT_EXCEEDED, req),
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      details: {
        retryAfter: err.retryAfter || 60,
        limit: err.limit || 0,
        remaining: err.remaining || 0,
      },
    };

    return res.status(ERROR_HTTP_STATUS[ErrorCode.RATE_LIMIT_EXCEEDED]).json(errorResponse);
  }

  next(err);
};

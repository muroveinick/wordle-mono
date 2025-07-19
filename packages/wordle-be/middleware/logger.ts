import { NextFunction, Request, Response } from "express";
import winston from "winston";

const customFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
  return `${timestamp} ${message} ${metaString}`.trim();
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), customFormat),
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: customFormat,
    })
  );
}

// Custom logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  logger.info("Request started", {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    requestId: req.headers["x-request-id"] || "unknown",
  });

  // Capture response body
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any = null;

  res.send = function (body?: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function (body?: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;

    // If chunk is provided and no body was captured via send/json, use chunk
    if (chunk && !responseBody) {
      responseBody = chunk;
    }

    let logPayload: any = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length"),
      requestId: req.headers["x-request-id"] || "unknown",
    };

    // Add response payload if it exists and is not too large
    if (responseBody) {
      try {
        const payloadString = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
        if (payloadString.length < 1000) {
          // Only log small payloads
          logPayload.responsePayload = responseBody;
        } else {
          logPayload.responsePayloadSize = payloadString.length;
        }
      } catch (error) {
        logPayload.responsePayloadError = "Failed to serialize response";
      }
    }

    logger.info("Request completed", logPayload);

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export default logger;

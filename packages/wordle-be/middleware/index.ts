import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { duplicateKeyErrorHandler, errorHandler, notFoundHandler, rateLimitErrorHandler, validationErrorHandler } from "./errorHandler";
import { requestLogger } from "./logger";

export function initializeMiddleware(app: Application): void {
  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Request parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // HTTP request logging (Morgan)
  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Custom request logging middleware
  app.use(requestLogger);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}

export function initializeErrorHandling(app: Application): void {
  // Error handling middleware (order matters!)
  app.use(rateLimitErrorHandler);
  app.use(validationErrorHandler);
  app.use(duplicateKeyErrorHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);
}

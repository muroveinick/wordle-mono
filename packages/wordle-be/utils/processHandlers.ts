import { Server } from "http";
import logger from "../middleware/logger";

export function setupProcessHandlers(server: Server): void {
  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    server.close(() => {
      process.exit(1);
    });
  });
}

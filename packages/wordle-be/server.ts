import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDatabase } from "./config/index.js";
import { initializeErrorHandling, initializeMiddleware } from "./middleware/index";
import logger from "./middleware/logger";
import authRoutes from "./routes/authRouter";
import gameRoutes from "./routes/gameRouter";
import { setupGameSocket } from "./services/gameSocket";
import { setupProcessHandlers } from "./utils/processHandlers";

dotenv.config({ path: "../../.env" });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Initialize middleware
initializeMiddleware(app);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Socket.io setup
setupGameSocket(io);

// Initialize error handling
initializeErrorHandling(app);

// Setup process handlers for graceful shutdown
setupProcessHandlers(server);

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    logger.info("Connected to database successfully");

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:4173"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

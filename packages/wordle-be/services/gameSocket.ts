import { ClientToServerEvents, ErrorData, GameStartedData, GuessResultData, MakeGuessData, ServerToClientEvents, StartGameData } from "@types";
import { Server, Socket } from "socket.io";
import logger from "../middleware/logger";
import Game from "../models/Game";
import { AuthService } from "./authService";
import { processGuess, startGame, validateGameGuess } from "./gameService";
import { SharedGameSocketService } from "./sharedGameSocketService";

interface GameRoom {
  players: Set<string>;
  gameId?: string;
}

const gameRooms: Map<string, GameRoom> = new Map();

export function setupGameSocket(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on("connection", async (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    logger.info("Socket connection established", { socketId: socket.id });

    // Log all socket events
    socket.onAny((eventName, ...args) => {
      logger.info(`[Socket ->][${eventName}]`, {
        socketId: socket.id,
        event: eventName,
        args: args.length > 0 ? args : undefined,
      });
    });

    // Intercept outgoing socket emissions
    const originalEmit = socket.emit.bind(socket);
    socket.emit = function (eventName: string, ...args: any[]) {
      logger.info(`[Socket emit <-][${eventName}]`, {
        socketId: socket.id,
        event: eventName,
        args: args.length > 0 ? args : undefined,
      });
      return originalEmit(eventName as any, ...args);
    };

    const originalTo = socket.to.bind(socket);

    socket.to = function (room: string) {
      const roomSocket = originalTo(room);
      const originalRoomEmit = roomSocket.emit.bind(roomSocket);

      roomSocket.emit = function (eventName: any, ...args: any[]) {
        logger.info(`[Socket room emit <-][${eventName}]`, {
          socketId: socket.id,
          userId,
          username,
          room,
          event: eventName,
          args: args.length > 0 ? args : undefined,
        });
        return originalRoomEmit(eventName, ...args);
      };

      return roomSocket;
    };

    // Try to authenticate for shared games
    let userId: string | undefined;
    let username: string | undefined;

    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = await AuthService.verifyToken(token);
        userId = decoded.userId;
        username = decoded.username;
        logger.info("Socket user authenticated for shared games", { userId, username, socketId: socket.id });
      } catch (error) {
        logger.warn("Socket authentication failed, proceeding without auth", { socketId: socket.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Setup shared game handlers if authenticated
    if (userId && username) {
      SharedGameSocketService.setupHandlers(io, socket, userId, username);
    }

    socket.on("start-game", async (data: StartGameData) => {
      const { playerId } = data;

      try {
        const { gameId, guesses, results } = await startGame(playerId);
        socket.emit("game-started", { gameId, guesses, results } as GameStartedData);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to start game" } as ErrorData);
      }
    });

    socket.on("make-guess", async (data: MakeGuessData) => {
      const { gameId, guess } = data;

      try {
        const game = await Game.findById(gameId);
        const validCheck = await validateGameGuess(game, guess);

        if (validCheck) {
          socket.emit("invalid-word", validCheck);
          return;
        }

        if (!game) {
          return;
        }

        const result = await processGuess(game, guess);
        const response: GuessResultData = {
          guess: guess.toUpperCase(),
          isComplete: result.isComplete,
          isWon: result.isWon,
          word: result.word,
          result: result.result,
        };

        socket.emit("guess-result", response);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to process guess" } as ErrorData);
      }
    });

    socket.on("disconnect", () => {
      gameRooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            gameRooms.delete(roomId);
          }
        }
      });
    });
  });
}

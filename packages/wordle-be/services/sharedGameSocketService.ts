import {
  ClientToServerEvents,
  ErrorData,
  GuessResultData,
  ServerToClientEvents,
  SharedGameCreatedData,
  SharedGameGuessData,
  SharedGameJoinData,
  SharedGameJoinedData,
  SharedGameLeaveData,
  SharedGameLeftData,
  SharedGamePlayerJoinedData,
  SharedGamePlayerLeftData,
  SharedGamePlayerOfflineData,
  SharedGamePlayerOnlineData,
  SharedPlayer,
} from "@types";
import User from "models/User";
import { Server, Socket } from "socket.io";
import logger from "../middleware/logger";
import { ISharedPlayer } from "../models/SharedGame";
import { SharedGameService } from "./sharedGameService";

export class SharedGameSocketService {
  private static userSocketMap = new Map<string, string>(); // userId -> socketId
  private static socketGameMap = new Map<string, string>(); // socketId -> gameId

  static setupHandlers(_io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>, userId: string, username: string) {
    // Track this user's socket
    SharedGameSocketService.userSocketMap.set(userId, socket.id);

    logger.info("Shared game socket handlers setup", { userId, username, socketId: socket.id });
    // Create a new shared game
    socket.on("shared-game-create", async () => {
      try {
        const game = await SharedGameService.createGame(userId);

        // Join the socket room
        socket.join(`shared-game-${game.gameId}`);
        SharedGameSocketService.socketGameMap.set(socket.id, game.gameId);

        // Send the game details back
        socket.emit("shared-game-created", {
          gameId: game.gameId,
          word: game.word, // Only send to creator initially
          players: await Promise.all(game.players.map((p) => SharedGameSocketService.toSharedPlayer(p))),
        } as SharedGameCreatedData);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to create game" } as ErrorData);
      }
    });

    // Join an existing shared game
    socket.on("shared-game-join", async (data: SharedGameJoinData) => {
      try {
        console.log("Joined shared game:", data);
        const result = await SharedGameService.joinGameAtomic(data.gameId, userId);

        socket.join(`shared-game-${result.game.gameId}`);
        SharedGameSocketService.socketGameMap.set(socket.id, result.game.gameId);

        socket.emit("shared-game-joined", {
          gameId: result.game.gameId,
          players: await Promise.all(result.game.players.map((p) => SharedGameSocketService.toSharedPlayer(p))),
          currentPlayer: await SharedGameSocketService.toSharedPlayer(result.player, true),
        } as SharedGameJoinedData);

        // Emit appropriate event based on whether this is a new join or reconnection
        if (result.alreadyInGame) {
          // Player was already in game - this is a reconnection
          socket.to(`shared-game-${result.game.gameId}`).emit("shared-game-player-went-online", {
            gameId: result.game.gameId,
            userId,
            username,
          } as SharedGamePlayerOnlineData);
        } else {
          // New player joining for the first time
          socket.to(`shared-game-${result.game.gameId}`).emit("shared-game-player-joined", {
            gameId: result.game.gameId,
            player: await SharedGameSocketService.toSharedPlayer(result.player, true),
          } as SharedGamePlayerJoinedData);
        }
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to join game" } as ErrorData);
      }
    });

    // Make a guess in shared game
    socket.on("shared-game-guess", async (data: SharedGameGuessData) => {
      const { gameId, guess } = data;

      try {
        const game = await SharedGameService.getGame(gameId);

        // Validate prerequisites first
        const validCheck = await SharedGameService.validateSharedGuess(game, userId, guess);
        if (validCheck) {
          socket.emit("invalid-word", validCheck);
          return;
        }

        if (!game) {
          return;
        }

        // Process the guess (guaranteed to succeed now)
        const result = await SharedGameService.processGuess(game, userId, guess);
        const response: GuessResultData = {
          guess: guess.toUpperCase(),
          isComplete: result.isComplete,
          isWon: result.isWon,
          word: result.word,
          result: result.result,
        };
        const player = game.getPlayerByUserId(userId);

        // Send result back to the guesser
        socket.emit("shared-game-guess-result", response);

        // Broadcast the guess to other players in the room
        if (player) {
          socket.to(`shared-game-${gameId}`).emit("shared-game-player-guess", {
            gameId: gameId,
            player: await SharedGameSocketService.toSharedPlayer(player, true),
            guess: guess,
            result: result.result,
          });
        }
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to process guess" } as ErrorData);
      }
    });

    // Leave shared game
    socket.on("shared-game-leave", async (data: SharedGameLeaveData) => {
      try {
        await SharedGameService.leaveGame(data.gameId, userId);

        // Leave the socket room
        socket.leave(`shared-game-${data.gameId}`);
        SharedGameSocketService.socketGameMap.delete(socket.id);

        // Notify other players
        socket.to(`shared-game-${data.gameId}`).emit("shared-game-player-left", {
          gameId: data.gameId,
          userId,
          username,
        } as SharedGamePlayerLeftData);

        socket.emit("shared-game-left", { gameId: data.gameId } as SharedGameLeftData);
      } catch (error: any) {
        socket.emit("error", { message: error.message || "Failed to leave game" } as ErrorData);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      // Clean up socket tracking
      SharedGameSocketService.userSocketMap.delete(userId);
      const gameId = SharedGameSocketService.socketGameMap.get(socket.id);
      SharedGameSocketService.socketGameMap.delete(socket.id);

      // Notify other players about the disconnection
      if (gameId) {
        // Emit offline event (player went offline but is still in the game)
        socket.to(`shared-game-${gameId}`).emit("shared-game-player-went-offline", {
          gameId: gameId,
          userId,
          username,
        } as SharedGamePlayerOfflineData);
      }

      // Note: We don't remove the player from the game model on disconnect
      // This allows them to reconnect and continue their game
    });

    socket.on("shared-game-player-went-offline", async () => {
      const gameId = SharedGameSocketService.socketGameMap.get(socket.id);

      if (gameId) {
        socket.to(`shared-game-${gameId}`).emit("shared-game-player-went-offline", {
          gameId: gameId,
          userId,
          username,
        } as SharedGamePlayerOfflineData);
      }
    });
  }

  // Helper method to check if a user is online
  static isUserOnline(userId: string): boolean {
    return SharedGameSocketService.userSocketMap.has(userId);
  }

  // Helper method to convert ISharedPlayer to SharedPlayer object
  static async toSharedPlayer(player: ISharedPlayer, forceOnline?: boolean): Promise<SharedPlayer> {
    const user = await User.findById(player.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      userId: player.userId.toString(),
      username: user.username,
      guesses: player.guesses,
      results: player.results,
      isComplete: player.isComplete,
      isWon: player.isWon,
      lastActivity: player.lastActivity,
      isOnline: forceOnline ?? SharedGameSocketService.isUserOnline(player.userId.toString()),
    };
  }
}

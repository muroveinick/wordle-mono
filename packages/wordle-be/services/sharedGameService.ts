import mongoose from "mongoose";
import SharedGame, { ISharedGame } from "../models/SharedGame";
import { InvalidWordResult, processGuessCore, validateGuess } from "../utils/guessUtils";
import { wordService } from "./wordService";
import { GuessResultData } from "@types";

export class SharedGameService {
  /**
   * Create a new shared game with a random word
   */
  static async createGame(creatorId: string, creatorUsername: string): Promise<ISharedGame> {
    // Generate unique gameId with retry logic
    let gameId: string;
    gameId = (SharedGame as any).generateGameId();
    const existingGame = await SharedGame.findOne({ gameId });
    if (existingGame) {
      throw new Error("Game ID already exists");
    }

    const word = wordService.getRandomAnswerWord();
    console.log(`Creating game with ID: ${gameId}, word: ${word}`);

    const game = new SharedGame({
      gameId,
      word,
      players: [],
      createdBy: new mongoose.Types.ObjectId(creatorId),
    });

    game.addPlayer(creatorId, creatorUsername);
    console.log("Game created:", game);

    // Add creator as first player

    try {
      await game.save();
      console.log("Game saved successfully with _id:", game._id);
    } catch (error) {
      console.error("Error saving game:", error);
      throw error;
    }

    return game;
  }

  /**
   * Atomically join a shared game to prevent race conditions
   */
  static async joinGameAtomic(gameId: string, userId: string, username: string): Promise<{
    game: ISharedGame;
    player: any;
    alreadyInGame: boolean;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // First, check if the game exists
    const existingGame = await SharedGame.findOne({ gameId });
    if (!existingGame) {
      throw new Error("Game not found");
    }

    // Check if player is already in the game
    const existingPlayer = existingGame.players.find(p => p.userId.toString() === userId);
    
    if (existingPlayer) {
      // Player already exists, just update last activity
      const updatedGame = await SharedGame.findOneAndUpdate(
        { 
          gameId,
          "players.userId": userObjectId 
        },
        { 
          $set: { "players.$.lastActivity": new Date() }
        },
        { new: true }
      );

      if (!updatedGame) {
        throw new Error("Failed to update player activity");
      }

      const player = updatedGame.getPlayerByUserId(userId);
      return {
        game: updatedGame,
        player,
        alreadyInGame: true
      };
    }

    // Player doesn't exist, add them atomically
    const newPlayer = {
      userId: userObjectId,
      username,
      guesses: [],
      results: [],
      isComplete: false,
      isWon: false,
      lastActivity: new Date(),
    };

    const updatedGame = await SharedGame.findOneAndUpdate(
      { 
        gameId,
        "players.userId": { $ne: userObjectId } // Ensure player doesn't exist
      },
      { 
        $push: { players: newPlayer }
      },
      { new: true }
    );

    if (!updatedGame) {
      // This means either game doesn't exist or player was already added by another request
      // Let's check what happened
      const recheckGame = await SharedGame.findOne({ gameId });
      if (!recheckGame) {
        throw new Error("Game not found");
      }
      
      const recheckPlayer = recheckGame.getPlayerByUserId(userId);
      if (recheckPlayer) {
        // Player was added by another concurrent request
        return {
          game: recheckGame,
          player: recheckPlayer,
          alreadyInGame: true
        };
      }
      
      throw new Error("Failed to join game due to race condition");
    }

    const player = updatedGame.getPlayerByUserId(userId);
    return {
      game: updatedGame,
      player,
      alreadyInGame: false
    };
  }

  /**
   * Leave a shared game
   */
  static async leaveGame(gameId: string, userId: string): Promise<ISharedGame> {
    const game = await SharedGame.findOne({ gameId });

    if (!game) {
      throw new Error("Game not found");
    }

    game.removePlayer(userId);
    await game.save();
    return game;
  }

  /**
   * Validate guess prerequisites and return InvalidWordResult if any issues
   */
  static async validateSharedGuess(game: ISharedGame | null, userId: string, guess: string): Promise<InvalidWordResult | null> {
    if (!game) {
      return {
        isInvalidWord: true,
        guess: guess.toUpperCase(),
        message: "Game not found",
      };
    }

    const player = game.getPlayerByUserId(userId);
    if (!player) {
      return {
        isInvalidWord: true,
        guess: guess.toUpperCase(),
        message: "Player not found in game",
      };
    }

    if (player.isComplete) {
      return {
        isInvalidWord: true,
        guess: guess.toUpperCase(),
        message: "Player has already completed the game",
      };
    }

    const upperGuess = guess.toUpperCase();
    const invalidResult = validateGuess(upperGuess);
    if (invalidResult) {
      return invalidResult;
    }

    return null;
  }

  /**
   * Process a guess and update player progress
   */
  static async processGuess(game: ISharedGame, userId: string, guess: string): Promise<GuessResultData> {
    const player = game.getPlayerByUserId(userId);
    if (!player) {
      throw new Error("Player not found in game");
    }

    const guessResult = processGuessCore(game.word, guess, player.guesses, 6, false);

    // Update player
    game.updatePlayerGuess(userId, guessResult.guess, guessResult.result, guessResult.isComplete, guessResult.isWon);

    await game.save();
    return guessResult;
  }

  /**
   * Get game details
   */
  static async getGame(gameId: string): Promise<ISharedGame | null> {
    return await SharedGame.findOne({ gameId });
  }

  /**
   * Clean up old games (optional cleanup job)
   */
  static async cleanupOldGames(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await SharedGame.deleteMany({
      createdAt: { $lt: oneDayAgo },
      isComplete: true,
    });
  }
}

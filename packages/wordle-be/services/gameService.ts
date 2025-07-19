import mongoose from "mongoose";
import Game from "../models/Game";
import { GuessResultData, IGame } from "@types";
import { checkGuess, InvalidWordResult, processGuessCore, validateGuess } from "../utils/guessUtils";
import { wordService } from "./wordService";

// Word management handled by WordService

function getRandomWord(): string {
  return wordService.getRandomAnswerWord();
}

// Removed - now using checkGuess from utils/guessUtils

export async function validateGameGuess(game: IGame | null, guess: string): Promise<InvalidWordResult | null> {
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.isComplete) {
    throw new Error("Game is already complete");
  }

  const upperGuess = guess.toUpperCase();
  const invalidResult = validateGuess(upperGuess);
  if (invalidResult) {
    return invalidResult;
  }

  return null;
}

export async function processGuess(game: IGame, guess: string): Promise<GuessResultData> {
  const guessResult = processGuessCore(game.word, guess, game.guesses, 6, true);

  game.guesses.push(guessResult.guess);
  game.isComplete = guessResult.isComplete;
  game.isWon = guessResult.isWon;

  await game.save();
  return guessResult;
}

export async function getStats(playerId: string) {
  const playerObjectId = new mongoose.Types.ObjectId(playerId);
  const games = await Game.find({ playerId: playerObjectId });
  const totalGames = games.length;
  const wonGames = games.filter((game) => game.isWon).length;
  const winRate = totalGames > 0 ? (wonGames / totalGames) * 100 : 0;

  return {
    totalGames,
    wonGames,
    winRate,
  };
}

export async function createNewGame(playerId: string) {
  const word = getRandomWord();
  const game = new Game({
    word,
    guesses: [],
    isComplete: false,
    isWon: false,
    playerId: new mongoose.Types.ObjectId(playerId),
  });

  await game.save();

  return {
    gameId: game._id,
    guesses: game.guesses,
  };
}

export async function startGame(playerId: string) {
  // Fetch the most recently created unfinished game for the player
  const playerObjectId = new mongoose.Types.ObjectId(playerId);
  const existingGame = await Game.findOne({ playerId: playerObjectId, isComplete: false }).sort({ createdAt: -1 });

  if (!existingGame) {
    // Requirement: for now we do **not** create a new game, simply indicate none exists.
    // throw new Error("No unfinished game found for this player");
    const newGame = await createNewGame(playerId);
    return {
      ...newGame,
      results: [],
    };
  }

  // Calculate results for all previous guesses
  const results = existingGame.guesses.map((guess) => checkGuess(existingGame.word, guess));

  return {
    gameId: existingGame._id,
    guesses: existingGame.guesses,
    results: results,
  };
}

export async function getGameById(gameId: string) {
  const game = await Game.findById(gameId).populate("playerId", "username email");
  if (!game) {
    throw new Error("Game not found");
  }

  // Calculate results for all guesses
  const results = game.guesses.map((guess) => checkGuess(game.word, guess));

  return {
    gameId: game._id,
    guesses: game.guesses,
    results: results,
    isComplete: game.isComplete,
    isWon: game.isWon,
    word: game.isComplete ? game.word : undefined,
    player: game.playerId, // This will contain username and email if populated
  };
}

export async function getGamesByUser(playerId: string, limit: number = 10) {
  const playerObjectId = new mongoose.Types.ObjectId(playerId);
  const games = await Game.find({ playerId: playerObjectId }).sort({ createdAt: -1 }).limit(limit).populate("playerId", "username email");

  return games.map((game) => ({
    gameId: game._id,
    guesses: game.guesses,
    isComplete: game.isComplete,
    isWon: game.isWon,
    word: game.isComplete ? game.word : undefined,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    player: game.playerId,
  }));
}

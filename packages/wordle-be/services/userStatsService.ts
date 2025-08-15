import mongoose from "mongoose";
import UserStats from "../models/UserStats";
import Game from "../models/Game";

export async function updateUserStats(userId: string, gameId: string) {
  const game = await Game.findById(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // Get or create user stats
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let userStats = await UserStats.findOne({ userId: userObjectId });
  
  if (!userStats) {
    userStats = new UserStats({
      userId: userObjectId,
      gamesPlayed: 0,
      gamesWon: 0,
      winStreak: 0,
      maxWinStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      averageGuesses: 0,
      totalGuesses: 0,
      hardWords: [],
      perfectGames: 0,
      lastPlayedDate: null
    });
  }

  // Update basic stats
  userStats.gamesPlayed += 1;
  userStats.lastPlayedDate = new Date();

  if (game.isWon) {
    userStats.gamesWon += 1;
    userStats.winStreak += 1;
    
    // Update max win streak
    if (userStats.winStreak > userStats.maxWinStreak) {
      userStats.maxWinStreak = userStats.winStreak;
    }

    // Update guess distribution
    const guessCount = game.guesses.length;
    if (guessCount >= 1 && guessCount <= 6) {
      userStats.guessDistribution[guessCount as keyof typeof userStats.guessDistribution] += 1;
    }

    // Update total guesses and average
    userStats.totalGuesses += guessCount;
    userStats.averageGuesses = userStats.totalGuesses / userStats.gamesWon;

    // Track perfect games (1-2 guesses)
    if (guessCount <= 2) {
      userStats.perfectGames += 1;
    }

    // Track hard words (5+ guesses)
    if (guessCount >= 5) {
      userStats.hardWords.push(game.word);
      // Keep only last 50 hard words to prevent unlimited growth
      if (userStats.hardWords.length > 50) {
        userStats.hardWords = userStats.hardWords.slice(-50);
      }
    }
  } else {
    // Game lost - reset win streak
    userStats.winStreak = 0;
  }

  await userStats.save();
  return userStats;
}

export async function getUserStats(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const userStats = await UserStats.findOne({ userId: userObjectId });
  
  if (!userStats) {
    // Return default stats if none exist
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winStreak: 0,
      maxWinStreak: 0,
      winRate: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      averageGuesses: 0,
      perfectGames: 0,
      hardWords: [],
      lastPlayedDate: null
    };
  }

  const winRate = userStats.gamesPlayed > 0 ? (userStats.gamesWon / userStats.gamesPlayed) * 100 : 0;

  return {
    gamesPlayed: userStats.gamesPlayed,
    gamesWon: userStats.gamesWon,
    winStreak: userStats.winStreak,
    maxWinStreak: userStats.maxWinStreak,
    winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
    guessDistribution: userStats.guessDistribution,
    averageGuesses: Math.round(userStats.averageGuesses * 100) / 100, // Round to 2 decimal places
    perfectGames: userStats.perfectGames,
    hardWords: userStats.hardWords.slice(-10), // Return last 10 hard words
    lastPlayedDate: userStats.lastPlayedDate
  };
}
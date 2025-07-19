// Simple shared game types for real-time word sharing

import { LetterStatus } from "./types";

export interface SharedGame {
  gameId: string;
  word: string;
  players: SharedPlayer[];
  createdAt: Date;
  createdBy: string; // User ID who created the game
}

export interface SharedPlayer {
  userId: string;
  username: string;
  guesses: string[];
  results: LetterStatus[][]; // Array of guess results
  isComplete: boolean;
  isWon: boolean;
  lastActivity: Date;
  isOnline?: boolean; // Optional property for online status
}

// Socket events for shared games
export interface SharedGameEvents {
  // Join a shared game by gameId
  "shared-game-join": (data: { gameId: string }) => void;

  // Broadcast a guess to all players in the game
  "shared-game-guess": (data: { gameId: string; guess: string; result: string[]; isComplete: boolean; isWon: boolean }) => void;

  // Leave a shared game
  "shared-game-leave": (data: { gameId: string }) => void;
}

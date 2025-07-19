import { Document } from "mongoose";

export type LetterStatus = "correct" | "present" | "absent" | "empty";

export interface GuessResult {
  letter: string;
  status: LetterStatus;
}

export interface IUser {
  username: string;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  maxWinStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGame extends Document {
  word: string;
  guesses: string[];
  isComplete: boolean;
  isWon: boolean;
  playerId: string; // ObjectId as string
  createdAt: Date;
  updatedAt: Date;
}

export interface GameState {
  gameId: string | null;
  currentGuess: string;
  guesses: string[];
  results: GuessResult[][];
  isComplete: boolean;
  isWon: boolean;
  word?: string;
  currentRow: number;
  currentCol: number;
}

export enum ErrorCode {
  // Game-specific errors
  GAME_NOT_FOUND = "GAME_NOT_FOUND",
  GAME_ALREADY_COMPLETE = "GAME_ALREADY_COMPLETE",
  INVALID_GUESS = "INVALID_GUESS",
  GUESS_TOO_SHORT = "GUESS_TOO_SHORT",
  GUESS_TOO_LONG = "GUESS_TOO_LONG",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",

  // HTTP errors
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  ENDPOINT_NOT_FOUND = "ENDPOINT_NOT_FOUND",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export interface ErrorResponse {
  code: ErrorCode;
  description: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
  stack?: string;
  requestId?: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ErrorResponse {
  code: ErrorCode.VALIDATION_ERROR;
  details: ValidationErrorDetail[];
}

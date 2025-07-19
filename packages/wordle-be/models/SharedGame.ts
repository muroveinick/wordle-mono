import { LetterStatus } from "@types";
import mongoose, { Document, Schema } from "mongoose";

export interface ISharedPlayer {
  userId: mongoose.Types.ObjectId;
  username: string;
  guesses: string[];
  results: LetterStatus[][]; // Array of arrays for each guess result
  isComplete: boolean;
  isWon: boolean;
  lastActivity: Date;
}

export interface ISharedGame extends Document {
  gameId: string;
  word: string;
  players: ISharedPlayer[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;

  // Instance methods
  addPlayer(userId: string, username: string): void;
  removePlayer(userId: string): void;
  updatePlayerGuess(userId: string, guess: string, result: string[], isComplete: boolean, isWon: boolean): void;
  getPlayerByUserId(userId: string): ISharedPlayer | undefined;
}

const SharedPlayerSchema = new Schema<ISharedPlayer>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  guesses: [{ type: String }],
  results: [[{ type: String }]], // Array of arrays
  isComplete: { type: Boolean, default: false },
  isWon: { type: Boolean, default: false },
  lastActivity: { type: Date, default: Date.now },
});

const SharedGameSchema = new Schema<ISharedGame>({
  gameId: { type: String, required: true, unique: true },
  word: { type: String, required: true },
  players: [SharedPlayerSchema],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Generate a simple readable game ID
SharedGameSchema.statics.generateGameId = function (): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Instance methods
SharedGameSchema.methods.addPlayer = function (userId: string, username: string) {
  // Check if player already exists
  const existingPlayer = this.players.find((p: ISharedPlayer) => p.userId.toString() === userId);

  if (!existingPlayer) {
    this.players.push({
      userId: new mongoose.Types.ObjectId(userId),
      username,
      guesses: [],
      results: [],
      isComplete: false,
      isWon: false,
      lastActivity: new Date(),
    });
  } else {
    // Update last activity
    existingPlayer.lastActivity = new Date();
  }
};

SharedGameSchema.methods.removePlayer = function (userId: string) {
  this.players = this.players.filter((p: ISharedPlayer) => p.userId.toString() !== userId);
};

SharedGameSchema.methods.updatePlayerGuess = function (userId: string, guess: string, result: string[], isComplete: boolean, isWon: boolean) {
  const player = this.players.find((p: ISharedPlayer) => p.userId.toString() === userId);

  if (player) {
    player.guesses.push(guess);
    player.results.push(result);
    player.isComplete = isComplete;
    player.isWon = isWon;
    player.lastActivity = new Date();
  }
};

SharedGameSchema.methods.getPlayerByUserId = function (userId: string): ISharedPlayer | undefined {
  const p = this.players.find((p: ISharedPlayer) => p.userId.toString() === userId);
  return p;
};

// Create indexes
SharedGameSchema.index({ gameId: 1 });
SharedGameSchema.index({ createdBy: 1 });
SharedGameSchema.index({ createdAt: 1 });

const SharedGame = mongoose.model<ISharedGame>("SharedGame", SharedGameSchema);
export default SharedGame;

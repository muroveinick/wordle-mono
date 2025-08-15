import mongoose, { Document, Schema } from "mongoose";

export interface IUserStats extends Document {
  userId: mongoose.Types.ObjectId;
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  maxWinStreak: number;
  guessDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  averageGuesses: number;
  totalGuesses: number;
  hardWords: string[]; // words that took 5+ guesses
  perfectGames: number; // games won in 1-2 guesses
  lastPlayedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserStatsSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    gamesWon: {
      type: Number,
      default: 0,
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    maxWinStreak: {
      type: Number,
      default: 0,
    },
    guessDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
      6: { type: Number, default: 0 }
    },
    averageGuesses: {
      type: Number,
      default: 0,
    },
    totalGuesses: {
      type: Number,
      default: 0,
    },
    hardWords: {
      type: [String],
      default: [],
    },
    perfectGames: {
      type: Number,
      default: 0,
    },
    lastPlayedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserStatsSchema.index({ userId: 1 });
UserStatsSchema.index({ gamesWon: -1 });
UserStatsSchema.index({ winStreak: -1 });

export default mongoose.model<IUserStats>("UserStats", UserStatsSchema);
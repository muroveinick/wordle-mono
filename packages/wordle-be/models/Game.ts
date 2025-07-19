import mongoose, { Document, Schema } from "mongoose";
import { IGame as IGameBase } from "@types";

export interface IGame extends Document, IGameBase {}

const GameSchema: Schema = new Schema(
  {
    word: {
      type: String,
      required: true,
      length: 5,
      uppercase: true,
    },
    guesses: [
      {
        type: String,
        length: 5,
        uppercase: true,
      },
    ],
    isComplete: {
      type: Boolean,
      default: false,
    },
    isWon: {
      type: Boolean,
      default: false,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
GameSchema.index({ playerId: 1, isComplete: 1 });
GameSchema.index({ playerId: 1, createdAt: -1 });

export default mongoose.model<IGame>("Game", GameSchema);

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const MONGODB_URI: string = process.env.MONGODB_URI || "mongodb://localhost:27017/wordle";

/**
 * Establishes a connection to MongoDB using mongoose.
 * Resolves once connected; rejects on error.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

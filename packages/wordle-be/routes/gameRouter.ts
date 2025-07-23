import express, { Response } from "express";
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from "../middleware/auth";
import * as gameService from "../services/gameService";
import { wordService } from "../services/wordService";

const router = express.Router();

// Start a new game (or resume existing incomplete game)
router.post("/start", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = await gameService.startGame(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start game" });
  }
});

// Get a specific game by ID
router.get("/:gameId", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const data = await gameService.getGameById(gameId);
    res.json(data);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Game not found" });
  }
});

// Get aggregated statistics for a player
router.get("/stats/:playerId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;
    const data = await gameService.getStats(playerId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Get user's games
router.get("/user/games", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    const games = await gameService.getGamesByUser(userId, limit);
    res.json(games);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get user games" });
  }
});

// Get word statistics (for debugging)
router.get("/debug/words", async (_req: express.Request, res: Response) => {
  try {
    const wordStats = wordService.getWordStats();
    res.json({
      ...wordStats,
      sampleAnswerWords: wordService.getAllAnswerWords().slice(0, 10),
      sampleValidWords: wordService.getAllValidWords().slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get word stats" });
  }
});

export default router;

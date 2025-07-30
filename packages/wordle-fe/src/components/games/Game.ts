import { GameStartedData } from "@types";
import { apiService } from "../../services/api";
import { GameMode } from "../../services/gameService";
import { Router } from "../../services/router";
import { Logger } from "../../utils/logger";
import { BaseGame } from "./BaseGame";
import { BaseGameUtils } from "./BaseGameUtils";

export class Game extends BaseGame {
  constructor() {
    super();
    this.CONTAINER = document.getElementById("basic-game-container")!;
    this.render();
    this.drawBaseComponents();
    this.initializeBaseComponents();
    this.gameService.setMode(GameMode.SINGLE_PLAYER);
    this.setupSocketListeners();
  }

  protected render(): void {
    this.CONTAINER.style.display = "block";
  }

  private processGameId(gameId: string) {
    this.gameService.setCurrentGameId(gameId);
    this.gameService.setMode(GameMode.SINGLE_PLAYER);
  }

  private onGameStarted(gameId: string) {
    this.processGameId(gameId);
    Router.getInstance().navigate(`/games/${gameId}`);
  }

  private setupSocketListeners(): void {
    // Setup single player socket event subscriptions
    const socketEvents = new Map<string, (...args: any[]) => void>([
      ["game-started", (data: GameStartedData) => this.handleGameStarted(data)],
      ["guess-result", BaseGameUtils.processGuessResultData],
      ["invalid-word", BaseGameUtils.handleInvalidWord],
      ["error", BaseGameUtils.handleError],
    ]);

    this.gameService.setupEventSubscriptions(socketEvents);
  }

  private processGameData(data: GameStartedData): void {
    Logger.log("Game started:", data);
    this.resetGameState();
    this.gameState.setGameId(data.gameId);

    data.guesses.forEach((g, index) =>
      BaseGameUtils.processGuessResultData({
        guess: g,
        result: data.results[index],
        isComplete: false,
        isWon: false,
      })
    );
  }

  private handleGameStarted(data: GameStartedData): void {
    if (this.gameService.getCurrentGameId() !== data.gameId) {
      this.onGameStarted(data.gameId);
    }

    this.showMessage("Game started!", "success");
  }

  startGame(gameId?: string): void {
    this.gameService.startSingleGame();
    if (gameId) {
      this.processGameId(gameId);
    }
  }

  async loadGameById(gameId: string): Promise<void> {
    try {
      const gameData = await apiService.getGameById(gameId);
      this.processGameData(gameData);

      // Set completion status
      this.gameState.setGameComplete(gameData.isComplete, gameData.isWon, gameData.word);

      if (gameData.isComplete) {
        if (gameData.isWon) {
          this.showMessage("Game completed - You won!", "success");
        } else {
          this.showMessage(`Game completed - The word was: ${gameData.word}`, "error");
        }
      } else {
        this.showMessage("Game loaded!", "success");
      }
    } catch (error) {
      Logger.error("Failed to load game:", error);
      this.showMessage("Failed to load game. It may not exist or be inaccessible.", "error");
    }
  }

  reset(): void {
    this.gameService.cleanup();
    this.resetGameState();
    this.setupSocketListeners();
  }

  protected cleanupSpecific(): void {
    this.gameService.cleanup();
    this.CONTAINER.innerHTML = "";
  }
}

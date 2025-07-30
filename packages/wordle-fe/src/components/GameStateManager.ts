import { GameState, GuessResult } from "@types";
import { Logger } from "../utils/logger";

export class GameStateManager {
  private static instance: GameStateManager;
  private state: GameState;
  private listeners: Array<(state: GameState) => void> = [];
  private isMultiplayer: boolean = true;

  private constructor() {
    this.state = {
      gameId: null,
      currentGuess: "",
      guesses: [],
      results: [],
      isComplete: false,
      isWon: false,
      currentRow: 0,
      currentCol: 0,
    };
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    (window as any)["state"] = GameStateManager.instance;

    return GameStateManager.instance;
  }

  getState(): GameState {
    return { ...this.state };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    Logger.warn("Subscribing to GameStateManager");

    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  unsubscribe(listener: (state: GameState) => void): void {
    Logger.warn("Unsubscribing from GameStateManager");

    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notify(): void {
    const state = this.getState();
    Logger.warn(this.listeners);
    this.listeners.forEach((listener) => listener(state));
  }

  public triggerUpdate(): void {
    this.notify();
  }

  setGameId(gameId: string | null): void {
    this.state.gameId = gameId;
    this.notify();
  }

  setCurrentGuess(guess: string): void {
    this.state.currentGuess = guess;
    this.notify();
  }

  addGuess(guess: string): void {
    this.state.guesses.push(guess);
    // this.notify();
  }

  addResult(result: GuessResult[]): void {
    this.state.results.push(result);
    // this.notify();
  }

  setGameComplete(isComplete: boolean, isWon: boolean, word?: string): void {
    this.state.isComplete = isComplete;
    this.state.isWon = isWon;
    if (word) {
      this.state.word = word;
    }
    this.notify();
  }

  nextRow(): void {
    this.state.currentRow++;
    this.state.currentCol = 0;
    // this.notify();
  }

  updateColumn(col: number): void {
    this.state.currentCol = col;
    this.notify();
  }

  reset(): void {
    this.state = {
      gameId: null,
      currentGuess: "",
      guesses: [],
      results: [],
      isComplete: false,
      isWon: false,
      currentRow: 0,
      currentCol: 0,
    };
    this.setMultiplayerMode(false);
    this.notify();
  }

  // Multiplayer support
  setMultiplayerMode(isMultiplayer: boolean): void {
    this.isMultiplayer = isMultiplayer;
  }

  isMultiplayerMode(): boolean {
    return this.isMultiplayer;
  }
}

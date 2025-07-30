import { SharedPlayer } from "@types";
import { Logger } from "../utils/logger";
import { getSocket, SocketService } from "./socket";

export interface SharedGameData {
  gameId: string;
  players: SharedPlayer[];
  currentPlayer?: SharedPlayer;
}

export enum GameMode {
  SINGLE_PLAYER = "single",
  SHARED = "shared",
}

export class GameService {
  private static instance: GameService;
  private socket: SocketService;
  private currentGameId: string | null = null;
  private currentMode: GameMode | null = null;
  private eventSubscriptions: Map<string, (...args: any[]) => void> = new Map();

  private constructor() {
    this.socket = getSocket();
  }

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  // Connection management
  public setMode(mode: GameMode): void {
    this.currentMode = mode;
  }

  public disconnect(): void {
    Logger.warn("Disconnecting from game");
    this.currentGameId = null;
    this.currentMode = null;
    this.cleanup();
  }

  // Setup event subscriptions using a map (similar to BaseGame pattern)
  public setupEventSubscriptions(eventMap: Map<string, (...args: any[]) => void>): void {
    eventMap.forEach((handler, eventName) => {
      this.socket.on(eventName, handler);
      this.eventSubscriptions.set(eventName, handler);
    });
  }

  // Game actions
  public startSingleGame(): void {
    if (this.currentMode !== GameMode.SINGLE_PLAYER) {
      throw new Error("Not in single player mode");
    }
    this.socket.startGame();
  }

  public createSharedGame(): void {
    if (this.currentMode !== GameMode.SHARED) {
      throw new Error("Not in shared game mode");
    }
    this.socket.emit("shared-game-create");
  }

  public joinSharedGame(gameId: string): void {
    if (this.currentMode !== GameMode.SHARED) {
      throw new Error("Not in shared game mode");
    }
    this.socket.emit("shared-game-join", { gameId });
  }

  public makeGuess(gameId: string, guess: string): void {
    if (this.currentMode === GameMode.SINGLE_PLAYER) {
      this.socket.makeGuess(gameId, guess);
    } else if (this.currentMode === GameMode.SHARED) {
      this.socket.emit("shared-game-guess", { gameId, guess });
    } else {
      throw new Error("Not connected to a game");
    }
  }

  public wentOffline(): void {
    this.socket.emit("shared-game-player-went-offline");
  }

  public leaveSharedGame(): void {
    Logger.log("leave game", this.currentMode, this.currentGameId);
    if (this.currentMode !== GameMode.SHARED || !this.currentGameId) {
      throw new Error("Not connected to a shared game");
    }
    this.socket.emit("shared-game-leave", { gameId: this.currentGameId });
  }

  // Cleanup
  public cleanup(): void {
    Logger.log("Cleaning up game service");
    this.eventSubscriptions.forEach((_handler, eventName) => {
      this.socket.off(eventName, _handler);
    });
    this.eventSubscriptions.clear();
    this.currentGameId = null;
    this.currentMode = null;
  }

  // Getters
  public getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  public setCurrentGameId(gameId: string | null): void {
    this.currentGameId = gameId;
  }

  public getCurrentMode(): GameMode | null {
    return this.currentMode;
  }

  public isConnected(): boolean {
    return this.socket?.isConnected() || false;
  }
}

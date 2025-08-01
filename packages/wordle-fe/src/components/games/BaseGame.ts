import { InvalidWordData } from "@types";
import { GameService } from "../../services/gameService";
import { Logger } from "../../utils/logger";
import { GameGrid } from "../GameGrid";
import { GameKeyboard } from "../GameKeyboard";
import { GameMessage } from "../GameMessage";
import { GameStateManager } from "../GameStateManager";
import { BaseGameUtils } from "./BaseGameUtils";

export abstract class BaseGame {
  protected gameState: GameStateManager;
  protected gameGrid?: GameGrid;
  protected gameKeyboard?: GameKeyboard;
  protected isInitialized = false;
  protected eventSubscriptions: Map<string, (...args: any[]) => void> = new Map();
  protected gameService: GameService;
  protected CONTAINER: HTMLElement;

  constructor() {
    this.gameState = GameStateManager.getInstance();
    this.gameService = GameService.getInstance();
    this.CONTAINER = document.getElementById("main")!;
  }

  /**
   * Initialize the base game components
   */

  protected drawBaseComponents(): void {
    this.CONTAINER.innerHTML += `
      <div id="game-grid-container" class="game-grid-container"></div>
      <div id="game-keyboard-container" class="flex flex-col items-center"></div>
    `;
  }

  protected initializeBaseComponents(): void {
    Logger.log("Initializing base components", this.isInitialized);
    if (this.isInitialized) {
      this.gameGrid?.cleanup();
      this.gameKeyboard?.cleanup();
    }
    // Create new components
    this.gameGrid = new GameGrid();
    this.gameKeyboard = new GameKeyboard();

    this.isInitialized = true;
  }

  /**
   * Reset the game state
   */
  protected resetGameState(): void {
    this.gameState.reset();
    const state = this.gameState.getState();
    if (this.gameGrid) {
      this.gameGrid.updateGrid(state);
    }
    if (this.gameKeyboard) {
      this.gameKeyboard.reset();
    }
  }

  handleInvalidWord(data: InvalidWordData): void {
    BaseGameUtils.showMessage(data.message, "error");
    this.gameGrid?.shakeCurrentRow();
  }

  /**
   * Show a message to the user
   */
  showMessage(message: string, type: "info" | "success" | "error" = "info"): void {
    const gameMessage = new GameMessage();
    if (gameMessage) {
      switch (type) {
        case "success":
          gameMessage.success(message);
          break;
        case "error":
          gameMessage.error(message);
          break;
        default:
          gameMessage.info(message);
          break;
      }
    }
  }

  /**
   * Enable/disable the keyboard
   */
  protected setKeyboardEnabled(enabled: boolean): void {
    if (this.gameKeyboard) {
      if (enabled) {
        this.gameKeyboard.enable();
      } else {
        this.gameKeyboard.disable();
      }
    }
  }

  /**
   * Check if the game is complete
   */
  protected isGameComplete(): boolean {
    return this.gameState.getState().isComplete;
  }

  /**
   * Get current game state
   */
  protected getGameState() {
    return this.gameState.getState();
  }

  /**
   * Setup event subscriptions using the provided map
   */
  protected setupEventSubscriptions(eventMap: Map<string, (...args: any[]) => void>, eventEmitter: any): void {
    eventMap.forEach((handler, eventName) => {
      eventEmitter.on(eventName, handler);
      this.eventSubscriptions.set(eventName, handler);
    });
  }

  /**
   * Cleanup event subscriptions
   */
  protected cleanupEventSubscriptions(eventEmitter: any): void {
    this.eventSubscriptions.forEach((_handler, eventName) => {
      eventEmitter.off(eventName);
    });
    this.eventSubscriptions.clear();
  }

  /**
   * Abstract method that subclasses must implement for their specific cleanup
   */
  protected abstract cleanupSpecific(): void;
  protected abstract render(): void;

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    // Clean up base components
    if (this.gameGrid) {
      this.gameGrid.cleanup();
      this.gameGrid = undefined;
    }

    if (this.gameKeyboard) {
      this.gameKeyboard.cleanup();
      this.gameKeyboard = undefined;
    }

    // Let subclasses clean up their specific resources
    this.cleanupSpecific();

    this.isInitialized = false;
  }
}

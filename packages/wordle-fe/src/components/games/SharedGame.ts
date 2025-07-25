import { SharedGamePlayerGuessData, SharedGamePlayerJoinedData, SharedGamePlayerOfflineData, SharedGamePlayerOnlineData, SharedPlayer } from "@types";
import { GameMode, SharedGameData } from "../../services/gameService";
import { Router } from "../../services/router";
import { Logger } from "../../utils/logger";
import { PlayersSidebar } from "../PlayersSidebar";
import { SharedGameSetup } from "../SharedGameSetup";
import { BaseGame } from "./BaseGame";
import { BaseGameUtils } from "./BaseGameUtils";
export class SharedGame extends BaseGame {
  private gameId: string | null = null;
  private playersSidebar: PlayersSidebar | null = null;
  private sharedGameSetup: SharedGameSetup | null = null;

  constructor(gameId?: string) {
    super();
    this.CONTAINER = document.getElementById("shared-game-container")!;

    this.setupEventListeners();
    this.processGameId(gameId);
  }

  processGameId(gameId?: string) {
    if (this.gameId === gameId && this.gameService.getCurrentMode() === GameMode.SHARED) {
      return;
    }

    this.gameId = gameId || null;
    this.gameService.setMode(GameMode.SHARED);

    try {
      if (this.gameId) {
        this.gameService.setCurrentGameId(this.gameId);
        this.gameService.joinSharedGame(this.gameId);
      }
    } catch (error: any) {
      this.showMessage(error.message || "Failed to join game", "error");
    } finally {
      this.render();
    }
  }

  private onGameEnd(): void {
    Router.getInstance().navigate("/");
  }

  private setupEventListeners(): void {
    // Setup shared game event subscriptions
    const sharedGameEvents = new Map<string, (...args: any[]) => void>([
      ["shared-game-created", (data: any) => Router.getInstance().navigate(`/shared/${data.gameId}`)],
      [
        "shared-game-joined",
        (data: SharedGameData) => {
          Logger.info("Joined shared game:", data);
          this.processGameId(data.gameId);
          // Restore current player's progress
          if (data.currentPlayer) {
            this.restorePlayerProgress(data.currentPlayer);
          }
          this.playersSidebar?.updatePlayers(data.players);
          this.showMessage("Joined shared game!", "success");
          // Trigger subscribers to update grid and keyboard with restored state
          // this.gameState.triggerUpdate();
        },
      ],
      [
        "shared-game-player-joined",
        (data: SharedGamePlayerJoinedData) => {
          this.showMessage(`${data.player.username} joined the game`, "info");
          this.playersSidebar?.addPlayer(data.player);
        },
      ],
      [
        "shared-game-player-left",
        (data: any) => {
          this.showMessage(`${data.username} left the game`, "info");
          this.playersSidebar?.removePlayer(data.userId);
        },
      ],
      ["shared-game-guess-result", BaseGameUtils.processGuessResultData],
      [
        "shared-game-player-guess",
        (data: SharedGamePlayerGuessData) => {
          this.playersSidebar?.updatePlayer(data.player);
        },
      ],
      [
        "shared-game-left",
        () => {
          this.gameId = null;
          this.gameService.setCurrentGameId(null);
        },
      ],

      [
        "shared-game-player-went-online",
        (data: SharedGamePlayerOnlineData) => {
          this.updatePlayerStatus(data.userId, "online");
        },
      ],
      [
        "shared-game-player-went-offline",
        (data: SharedGamePlayerOfflineData) => {
          this.updatePlayerStatus(data.userId, "offline");
        },
      ],

      ["invalid-word", BaseGameUtils.handleInvalidWord],
      ["error", BaseGameUtils.handleError],
    ]);

    this.gameService.setupEventSubscriptions(sharedGameEvents);

    // Setup guess submission callback
    this.gameState.setGuessSubmitCallback((guess: string) => {
      if (this.gameId) {
        this.gameService.makeGuess(this.gameId, guess);
      }
    });
  }

  private restorePlayerProgress(player: SharedPlayer): void {
    this.resetGameState();

    player.guesses.forEach((g, index) =>
      BaseGameUtils.processGuessResultData({
        guess: g,
        result: player.results[index],
        isComplete: player.isComplete,
        isWon: player.isWon,
      })
    );
  }

  private async createGame(): Promise<void> {
    try {
      this.gameService.setMode(GameMode.SHARED);
      this.gameService.createSharedGame();
    } catch (error: any) {
      this.showMessage(error.message || "Failed to create game", "error");
    }
  }

  protected render(): void {
    if (this.sharedGameSetup) {
      this.sharedGameSetup.cleanup();
    }

    if (!this.gameId) {
      // Show create/join interface

      this.sharedGameSetup = new SharedGameSetup(this.CONTAINER, {
        onCreateGame: () => this.createGame(),
        onJoinGame: (gameId: string) => Router.getInstance().navigate(`/shared/${gameId}`),
      });
    } else {
      // Show game interface
      this.CONTAINER.innerHTML = `
        <div class="shared-game">
          <div class="game-header mb-6">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold">Shared Game: ${this.gameId}</h2>
              <div class="game-actions">
                <button id="copy-link-btn" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm">
                  Copy Link
                </button>
                <button id="leave-game-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm ml-2">
                  Leave Game
                </button>
              </div>
            </div>
          </div>
          
          <div class="game-content flex gap-8">
            <div class="main-game flex-1">
              <div id="game-grid-container" class="game-grid-container mb-6"></div>
              <div id="game-message-container" class="game-message-container mb-4"></div>
              <div id="game-keyboard-container" class="game-keyboard-container"></div>
            </div>
            
            <div id="players-sidebar-container"></div>
          </div>
        </div>
      `;

      this.initializeBaseComponents();
      this.initializePlayersSidebar();
      this.setupGameEventListeners();
    }
  }

  private setupGameEventListeners(): void {
    const copyLinkBtn = this.CONTAINER.querySelector("#copy-link-btn") as HTMLButtonElement;
    const leaveGameBtn = this.CONTAINER.querySelector("#leave-game-btn") as HTMLButtonElement;

    copyLinkBtn?.addEventListener("click", () => {
      const gameLink = `${window.location.origin}/shared/${this.gameId}`;
      navigator.clipboard.writeText(gameLink);
      this.showMessage("Game link copied to clipboard!", "success");
    });

    leaveGameBtn?.addEventListener("click", () => {
      this.leaveGame();
    });
  }

  private initializePlayersSidebar(): void {
    if (this.playersSidebar) {
      this.playersSidebar.cleanup();
    }
    const sidebarContainer = this.CONTAINER?.querySelector("#players-sidebar-container") as HTMLElement;
    if (sidebarContainer) {
      this.playersSidebar = new PlayersSidebar(sidebarContainer);
    }
  }

  private updatePlayerStatus(userId: string, status: "online" | "offline"): void {
    this.playersSidebar?.updatePlayerStatus(userId, status);
  }

  private leaveGame(): void {
    if (this.gameId) {
      this.gameService.leaveSharedGame();
      this.gameId = null;
      this.resetGameState();
      this.onGameEnd();
    }
  }

  protected cleanupSpecific(): void {
    this.playersSidebar?.cleanup();
    this.sharedGameSetup?.cleanup();
    this.gameService.cleanup();
    this.gameState.setGuessSubmitCallback();
    this.gameService.disconnect();
    this.gameService.wentOffline();
    this.CONTAINER.innerHTML = "";
  }
}

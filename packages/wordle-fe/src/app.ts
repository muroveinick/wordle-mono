import { AuthForm } from "./components/AuthForm";
import { GameStateManager } from "./components/GameStateManager";
import { UserProfile } from "./components/UserProfile";
import { Game } from "./components/games/Game";
import { SharedGame } from "./components/games/SharedGame";
import { authService } from "./services/authService";
import { ContainerManager } from "./services/containerManager";
import { Router } from "./services/router";
import { SocketService, getSocket, setSocket } from "./services/socket";
import { Logger } from "./utils/logger";

export class App {
  private game?: Game;
  private startGameButton!: HTMLButtonElement;
  private title!: HTMLButtonElement;
  private startSharedGameButton!: HTMLButtonElement;
  private router!: Router;
  private authForm!: AuthForm;
  private userProfile!: UserProfile;
  private sharedGame?: SharedGame;
  private containerManager!: ContainerManager;

  constructor() {
    setSocket(new SocketService());
    this.createHTML();
    this.setupElements();
    this.setupGameEventListeners();
    this.setupRouter();

    (window as any)["app"] = this;
  }

  private createHTML(): void {
    document.body.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div id="auth-container" style="display: none;"></div>
        
        <!-- Header -->
        <header class="bg-gray-800 border-b border-gray-700 p-4">
          <div class="max-w-6xl mx-auto flex items-center justify-between">
            <h1 id="game-title" class="text-3xl font-bold cursor-pointer hover:text-blue-400 transition-colors">Wordle</h1>
            <div id="user-profile-container" class="flex flex-basis-1/2"></div>
          </div>
        </header>
        
        <!-- Main Content -->
        <div class="p-4">
          <div id="game-content" class="max-w-md mx-auto">
            <div class="flex flex-col items-center gap-4 mb-8">
              <div class="flex justify-center gap-4">
                <button id="start-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold">
                  Start Single Player
                </button>
                <button id="shared-game-btn" class="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold">
                  Play Coop Game
                </button>
              </div>
            </div>
          </div>
            
          <div id="shared-game-container" class="max-w-6xl mx-auto" style="display: none;"></div>
          <div id="basic-game-container" class="max-w-6xl mx-auto" style="display: none;"></div>

          <footer id="game-footer" class="text-center mt-8 text-sm text-gray-400" style="display: none;">
            <p>Use your keyboard or click the buttons to play</p>
            <p>Green = correct letter and position</p>
            <p>Yellow = correct letter, wrong position</p>
            <p>Gray = letter not in word</p>
          </footer>
        </div>
      </div>
    `;
  }

  private setupElements(): void {
    this.containerManager = ContainerManager.getInstance();

    const authContainer = document.getElementById("auth-container") as HTMLElement;
    const userProfileContainer = document.getElementById("user-profile-container") as HTMLElement;

    this.startGameButton = document.getElementById("start-btn") as HTMLButtonElement;
    this.title = document.getElementById("game-title") as HTMLButtonElement;
    this.startSharedGameButton = document.getElementById("shared-game-btn") as HTMLButtonElement;

    this.authForm = new AuthForm(authContainer, (user) => {
      this.onAuthSuccess(user);
    });

    this.userProfile = new UserProfile(userProfileContainer, () => {
      this.onLogout();
    });
  }

  public startGame(gameId?: string): void {
    Logger.log("Starting game", gameId);
    this.containerManager.setViewState("singlePlayer");
    GameStateManager.getInstance().reset();
    this.connectToServer();

    if (!this.game) {
      this.cleanUpSharedGame();
      this.game = new Game();
      this.game.startGame(gameId);
    }
  }

  private setupGameEventListeners(): void {
    this.startGameButton.addEventListener("click", () => {
      this.startGame();
    });

    this.title.addEventListener("click", () => {
      this.router.navigate("/");
    });

    this.startSharedGameButton.addEventListener("click", () => {
      Logger.log("Navigating to shared game");
      this.router.navigate("/shared");
    });
  }

  private setupRouter(): void {
    this.router = Router.getInstance();

    // Home route
    this.router.addRoute("/", () => {
      Logger.log("Navigating to home");
      this.cleanUpGame();
      this.cleanUpSharedGame();
      if (authService.isAuthenticated()) {
        this.containerManager.setViewState("home");
      } else {
        this.showAuthForm();
      }
    });

    // Game route
    this.router.addRoute("/games/:gameId", (params: { gameId: string }) => {
      this.containerManager.setViewState("singlePlayer");

      // If game is not initialized, redirect to auth or initialize first
      if (authService.isAuthenticated()) {
        if (!this.game) {
          this.startGame(params.gameId);
        }
      } else {
        this.router.navigate("/");
      }
    });

    // Shared game routes
    this.router.addRoute("/shared", () => {
      this.containerManager.setViewState("sharedGame");
      this.connectToServer();

      if (authService.isAuthenticated()) {
        this.showSharedGameView();
      } else {
        this.router.navigate("/");
      }
    });

    this.router.addRoute("/shared/:gameId", async (params: { gameId: string }) => {
      this.containerManager.setViewState("sharedGame");

      if (authService.isAuthenticated()) {
        if (this.sharedGame) {
          this.sharedGame.processGameId(params.gameId);
        } else {
          this.showSharedGameView(params.gameId);
        }
      } else {
        this.router.navigate("/");
      }
    });

    // Default route
    this.router.addRoute("*", () => {
      this.router.navigate("/");
    });

    // Start the router
    this.router.start();
  }

  private connectToServer(): void {
    if (getSocket().isConnected()) {
      return;
    }
    setSocket(new SocketService());
    getSocket().connect();
  }

  private showAuthForm(): void {
    this.containerManager.setViewState("auth");
    this.authForm.show();
    this.userProfile.hide();
  }

  private showGameContent(): void {
    this.containerManager.setViewState("home");
    this.authForm.hide();
    this.userProfile.show();
  }

  private onAuthSuccess(user: any): void {
    this.userProfile.updateUser(user);
    this.showGameContent();
  }

  private onLogout(): void {
    this.cleanUpGame();
    this.cleanUpSharedGame();
    this.showAuthForm();
  }

  private showSharedGameView(gameId?: string): void {
    this.cleanUpGame();
    this.connectToServer();

    // Initialize shared game - always recreate if gameId is provided to ensure proper initialization
    if (!this.sharedGame || gameId) {
      // Clean up existing shared game if gameId is provided
      if (this.sharedGame && gameId) {
        this.cleanUpSharedGame();
      }

      this.sharedGame = new SharedGame(gameId);
    }
  }

  private cleanUpSharedGame(): void {
    Logger.log("shared game cleanup", !!this.sharedGame);
    if (this.sharedGame) {
      this.sharedGame.cleanup();
      this.sharedGame = undefined;
    }
  }

  private cleanUpGame(): void {
    Logger.log("game cleanup", !!this.game);
    if (this.game) {
      this.game.cleanup();
      this.game = undefined;
    }
  }
}

new App();

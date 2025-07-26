export interface SharedGameSetupCallbacks {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
}

export class SharedGameSetup {
  private container: HTMLElement;
  private callbacks: SharedGameSetupCallbacks;
  private createBtn: HTMLButtonElement | null = null;
  private joinBtn: HTMLButtonElement | null = null;
  private gameIdInput: HTMLInputElement | null = null;

  private handleCreateClick = () => {
    this.callbacks.onCreateGame();
  };

  private handleJoinClick = () => {
    const gameId = this.gameIdInput?.value.trim().toUpperCase();
    if (gameId) {
      this.callbacks.onJoinGame(gameId);
    }
  };

  private handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      this.handleJoinClick();
    }
  };

  constructor(container: HTMLElement, callbacks: SharedGameSetupCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.addEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="shared-game-setup">
        <h2 class="text-2xl font-bold text-center mb-6">Shared Coop Game</h2>
        
        <div class="setup-options max-w-md mx-auto">
          <div class="mb-6">
            <button id="create-game-btn" class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-white">
              Create New Coop Game
            </button>
          </div>
          
          <div class="text-center text-gray-400 mb-4">OR</div>
          
          <div class="join-game">
            <input 
              type="text" 
              id="game-id-input" 
              placeholder="Enter game ID (e.g., ABC123)" 
              class="w-full px-4 py-2 bg-gray-700 text-white rounded mb-3"
              maxlength="6"
            />
            <button id="join-game-btn" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold text-white">
              Join Coop Game
            </button>
          </div>
        </div>
        
        <div id="setup-message" class="setup-message mt-6"></div>
      </div>
    `;
  }

  private addEventListeners(): void {
    this.createBtn = this.container.querySelector("#create-game-btn") as HTMLButtonElement;
    this.joinBtn = this.container.querySelector("#join-game-btn") as HTMLButtonElement;
    this.gameIdInput = this.container.querySelector("#game-id-input") as HTMLInputElement;

    this.createBtn?.addEventListener("click", this.handleCreateClick);
    this.joinBtn?.addEventListener("click", this.handleJoinClick);
    this.gameIdInput?.addEventListener("keypress", this.handleKeyPress);
  }

  private removeEventListeners(): void {
    this.createBtn?.removeEventListener("click", this.handleCreateClick);
    this.joinBtn?.removeEventListener("click", this.handleJoinClick);
    this.gameIdInput?.removeEventListener("keypress", this.handleKeyPress);
  }

  public cleanup(): void {
    this.removeEventListeners();
    this.container.innerHTML = "";
  }
}
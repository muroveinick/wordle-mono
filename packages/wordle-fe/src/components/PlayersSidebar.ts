import { GameState, LetterStatus, SharedPlayer } from "@types";
import { authService } from "../services/authService";
import { GameStateManager } from "./GameStateManager";
import { BaseGameUtils } from "./games/BaseGameUtils";

export class PlayersSidebar {
  private container: HTMLElement;
  private players: Array<SharedPlayer> = [];

  private listener = (() => {
    let resultsLength: number | null = null;

    return (state: GameState) => {
      const user = authService.getUser();
      const isCurrentUser = user && this.players.find((p) => p.userId === user.id);

      if (isCurrentUser) {
        // Only update if the state has actually changed
        if (resultsLength !== state.results.length) {
          isCurrentUser.guesses = state.guesses;
          isCurrentUser.results = BaseGameUtils.gameStateToLetterStatuses(state);
          this.updatePlayerCard(isCurrentUser);

          resultsLength = state.results.length;
        }
      }
    };
  })();

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    GameStateManager.getInstance().subscribe(this.listener);
  }

  public updatePlayers(players: Array<SharedPlayer>): void {
    this.players = players;
    this.render();
  }

  public addPlayer(player: SharedPlayer): void {
    const existingPlayer = this.players.find((p) => p.userId === player.userId);
    if (!existingPlayer) {
      this.players.push(player);

      const playersList = this.container.querySelector("#players-list");
      if (playersList && this.players.length > 1) {
        const noPlayersMsg = playersList.querySelector(".text-gray-400");
        if (noPlayersMsg) {
          noPlayersMsg.remove();
        }

        const newCardHTML = this.renderPlayerCard(player);
        playersList.insertAdjacentHTML("beforeend", newCardHTML);
      } else {
        this.render();
      }
    }
  }

  public removePlayer(userId: string): void {
    this.players = this.players.filter((p) => p.userId !== userId);

    const playerCard = this.findPlayerCard(userId);
    if (playerCard) {
      playerCard.remove();

      // If no players left, show "No players yet" message
      if (this.players.length === 0) {
        const playersList = this.container.querySelector("#players-list");
        if (playersList) {
          playersList.innerHTML = '<div class="text-gray-400">No players yet</div>';
        }
      }
    } else {
      // Card not found, fall back to full render
      this.render();
    }
  }

  public updatePlayer(player: SharedPlayer): void {
    const playerIndex = this.players.findIndex((p) => p.userId === player.userId);
    if (playerIndex !== -1) {
      this.players[playerIndex] = player;
      this.updatePlayerCard(player);
    }
  }

  public updatePlayerStatus(userId: string, status: "online" | "offline"): void {
    const player = this.players.find((p) => p.userId === userId);
    if (player) {
      player.isOnline = status === "online";
      this.updatePlayerCard(player);
    }
  }

  private findPlayerCard(userId: string): HTMLElement | null {
    return this.container.querySelector(`#player-${userId}`);
  }

  private updatePlayerCard(player: SharedPlayer): void {
    const existingCard = this.findPlayerCard(player.userId);
    if (existingCard) {
      // Replace the existing card with updated HTML
      const newCardHTML = this.renderPlayerCard(player);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newCardHTML;
      const newCard = tempDiv.firstElementChild as HTMLElement;

      if (newCard) {
        existingCard.replaceWith(newCard);
      }
    } else {
      // Card doesn't exist, fall back to full render
      this.render();
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="players-sidebar w-64">
        <h3 class="text-lg font-bold mb-3">Players</h3>
        <div id="players-list" class="players-list">
          ${this.renderPlayersList()}
        </div>
      </div>
    `;
  }

  private renderPlayersList(): string {
    const user = authService.getUser();

    return this.players.map((player) => this.renderPlayerCard(player, user)).join("") || '<div class="text-gray-400">No players yet</div>';
  }

  private renderPlayerCard(player: SharedPlayer, user?: any): string {
    const currentUser = user || authService.getUser();
    const isCurrentUser = currentUser && player.userId === currentUser.id;

    return `
      <div id="player-${player.userId}" class="player-card mb-3 p-3 bg-gray-700 rounded ${isCurrentUser ? "border-2 border-blue-500" : ""}">
        <div class="player-info mb-2">
          <div class="player-name font-bold">
            <span class="status-indicator ${isCurrentUser || player.isOnline ? "status-online" : "status-offline"}"></span>
            ${player.username}
            ${isCurrentUser ? '<span class="text-blue-400 text-sm">(You)</span>' : ""}
          </div>
          <div class="player-progress text-sm text-gray-400">
            ${player.guesses.length}/6 guesses
            ${player.isComplete ? (player.isWon ? "✅ Solved!" : "❌ Failed") : "🎮 Playing"}
          </div>
        </div>
        
        <div class="player-results">
          ${player.results
            .map(
              (result) => `
            <div class="guess flex gap-1">
              ${this.letterStatusesToSquares(result)}
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  private letterStatusesToSquares(result: LetterStatus[]): string {
    return result
      .map((status) => {
        return `<span class="square ${status}"></span>`;
      })
      .join("");
  }

  cleanup(): void {
    GameStateManager.getInstance().unsubscribe(this.listener);
  }
}

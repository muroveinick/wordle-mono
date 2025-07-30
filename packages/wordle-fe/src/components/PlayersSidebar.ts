import { GameState, LetterStatus, LetterStatusMap, SharedPlayer } from "@types";
import { authService } from "../services/authService";
import { GameStateManager } from "./GameStateManager";
import { BaseGameUtils } from "./games/BaseGameUtils";

export class PlayersSidebar {
  private container: HTMLElement;
  private players: Array<SharedPlayer> = [];
  private isCompactView: boolean = true;

  private listener = (() => {
    let resultsLength: number | null = null;

    return (state: GameState) => {
      if (resultsLength !== state.results.length) {
        const user = authService.getUser();
        const isCurrentUser = user && this.players.find((p) => p.userId === user.id);

        if (isCurrentUser) {
          // Only update if the state has actually changed
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

  private sortPlayers(players: Array<SharedPlayer>): Array<SharedPlayer> {
    let resultedPlayers = [];

    const user = authService.getUser();
    const currentUser = user && players.find((p) => p.userId === user.id);

    if (currentUser) {
      // Move current user to the top
      resultedPlayers.push(currentUser);
      players = players.filter((p) => p.userId !== user.id);
    }
    players.sort((a, b) => {
      if (a.isOnline && !b.isOnline) {
        return -1;
      } else if (!a.isOnline && b.isOnline) {
        return 1;
      } else {
        return a.username.localeCompare(b.username);
      }
    });

    return [...resultedPlayers, ...players];
  }

  public updatePlayers(players: Array<SharedPlayer>): void {
    this.players = this.sortPlayers(players);
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

        const user = authService.getUser();
        const newCardHTML = this.renderPlayerCard(player, user);
        playersList.insertAdjacentHTML("beforeend", newCardHTML);
        // Re-attach toggle listener since we might have lost it
        this.attachToggleListener();
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
      const user = authService.getUser();
      const newCardHTML = this.renderPlayerCard(player, user);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newCardHTML;
      const newCard = tempDiv.firstElementChild as HTMLElement;

      if (newCard) {
        existingCard.replaceWith(newCard);
        // Re-attach event listener for toggle button since we replaced the card
        this.attachToggleListener();
      }
    } else {
      // Card doesn't exist, fall back to full render
      this.render();
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="players-sidebar">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold">Players</h3>
          <button id="view-toggle" class="view-toggle-btn" title="${this.isCompactView ? "Switch to Full View" : "Switch to Compact View"}">
            ${this.isCompactView ? "↕" : "↔"}
          </button>
        </div>
        <div id="players-list" class="players-list">
          ${this.renderPlayersList()}
        </div>
      </div>
    `;

    this.attachToggleListener();
  }

  private renderPlayersList(): string {
    const user = authService.getUser();
    const clone = this.players.slice();

    // return (
    //   [clone, clone, clone, clone]
    //     .flat()
    //     .map((player) => this.renderPlayerCard(player, user))
    //     .join("") || '<div class="text-gray-400">No players yet</div>'
    // );

    return this.players.map((player) => this.renderPlayerCard(player, user)).join("") || '<div class="text-gray-400">No players yet</div>';
  }

  private renderPlayerCard(player: SharedPlayer, user?: any): string {
    const currentUser = user || authService.getUser();
    const isCurrentUser = currentUser && player.userId === currentUser.id;

    return `
      <div id="player-${player.userId}" class="player-card ${isCurrentUser ? "current-user" : ""}">
          <div class="flex items-center gap-2">
            <span class="status-indicator ${isCurrentUser || player.isOnline ? "status-online" : "status-offline"}"></span>
            <div class="flex flex-col flex-1">
              <div class="player-name">
                <span class="player-username">${player.username}</span>
              </div>
              <div class="player-progress text-sm text-gray-400">
                ${player.guesses.length}/6 guesses
                ${player.isComplete ? (player.isWon ? "✅ Solved!" : "❌ Failed") : "🎮 Playing"}
              </div>
            </div>
            <div class="guess-progress">
              ${this.renderGuessDots(player.results)}
            </div>
          </div>
      ${
        !this.isCompactView && player.results.length > 0
          ? `<div class="player-results">
          ${player.results
            .map(
              (result) => `
            <div class="guess flex gap-1">
              ${this.letterStatusesToSquares(result)}
            </div>
          `
            )
            .join("")}
        </div>`
          : ""
      }
      </div>
    `;
  }

  private letterStatusesToSquares(result: LetterStatus[]): string {
    return result
      .map((status) => {
        const cssClass = LetterStatusMap[status];
        return `<span class="square ${cssClass}"></span>`;
      })
      .join("");
  }

  private renderGuessDots(results: LetterStatus[][]): string {
    const dots = [];

    for (let i = 0; i < 6; i++) {
      if (i < results.length) {
        const guessResult = results[i];
        const dotClass = this.getDotClass(guessResult);
        dots.push(`<div class="guess-dot ${dotClass}"></div>`);
      } else {
        dots.push(`<div class="guess-dot"></div>`);
      }
    }

    return dots.join("");
  }

  private getDotClass(guessResult: LetterStatus[]): string {
    if (guessResult.every((status) => status === "c")) {
      return LetterStatusMap["c"];
    } else if (guessResult.some((status) => status === "p" || status === "c")) {
      return LetterStatusMap["p"];
    } else {
      return LetterStatusMap["a"];
    }
  }

  private attachToggleListener(): void {
    const toggleBtn = this.container.querySelector("#view-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleView());
    }
  }

  private toggleView(): void {
    this.isCompactView = !this.isCompactView;
    this.render();
  }

  cleanup(): void {
    GameStateManager.getInstance().unsubscribe(this.listener);
  }
}

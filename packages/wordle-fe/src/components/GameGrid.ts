import { GameState, LetterStatusMap } from "@types";
import { GameStateManager } from "./GameStateManager";

export class GameGrid {
  private gridElement: HTMLElement;
  private gameState: GameStateManager;
  private subscriber = (state: GameState) => {
    this.updateCurrentTile(state);
    this.updateGrid(state);
  };

  constructor() {
    const container = document.querySelector("#game-grid-container");
    if (!container) {
      throw new Error("Game grid container not found");
    }
    this.gridElement = container as HTMLElement;
    this.gameState = GameStateManager.getInstance();
    this.createGrid();

    this.gameState.subscribe(this.subscriber);
  }

  private createGrid(): void {
    this.gridElement.innerHTML = "";
    for (let row = 0; row < 6; row++) {
      const rowElement = document.createElement("div");
      rowElement.className = "flex gap-2 mb-2";

      for (let col = 0; col < 5; col++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${row}-${col}`;
        rowElement.appendChild(tile);
      }

      this.gridElement.appendChild(rowElement);
    }
  }

  private updateCurrentTile(state: GameState): void {
    for (let col = 0; col < 5; col++) {
      const tile = document.getElementById(`tile-${state.currentRow}-${col}`);
      if (tile) {
        if (col < state.currentGuess.length) {
          tile.textContent = state.currentGuess[col];
          tile.className = "tile filled";
        } else {
          tile.textContent = "";
          tile.className = "tile";
        }
      }
    }
  }

  public updateGrid(state: GameState): void {
    // Clear all tiles first
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const tile = document.getElementById(`tile-${row}-${col}`);
        if (tile && row !== state.currentRow) {
          tile.textContent = "";
          tile.className = "tile";
        }
      }
    }

    // Update completed rows
    state.guesses.forEach((guess: string, rowIndex: number) => {
      const result = state.results[rowIndex];
      if (result) {
        for (let col = 0; col < 5; col++) {
          const tile = document.getElementById(`tile-${rowIndex}-${col}`);
          if (tile) {
            tile.textContent = guess[col];
            tile.className = `tile ${LetterStatusMap[result[col].status]}`;
          }
        }
      }
    });
  }

  // Legacy methods for backward compatibility - these are no longer needed
  // as the GameGrid subscribes to state changes directly

  reset(): void {
    this.createGrid();
  }

  cleanup(): void {
    this.gameState.unsubscribe(this.subscriber);
  }

  shakeCurrentRow(): void {
    const state = this.gameState.getState();
    const currentRowElement = this.gridElement.children[state.currentRow] as HTMLElement;

    if (currentRowElement) {
      currentRowElement.classList.add("shake");
      setTimeout(() => {
        currentRowElement.classList.remove("shake");
      }, 500);
    }
  }
}

import { GameState, GuessResult } from "@types";
import { Logger } from "../utils/logger";
import { BaseGameUtils } from "./games/BaseGameUtils";
import { GameStateManager } from "./GameStateManager";

export class GameKeyboard {
  private keyboardElement: HTMLElement;
  private onKeyPress = BaseGameUtils.addLetter;
  private onEnter = BaseGameUtils.submitGuess;
  private onBackspace = BaseGameUtils.deleteLetter;
  private isEnabled: boolean = true;
  private keydownHandler?: (e: KeyboardEvent) => void;
  private results: GuessResult[][] | undefined = undefined;
  private listener = (newState: GameState) => {
    try {
      if (this.results?.length !== newState.results.length) {
        this.updateKeyboard(newState.results);
      }
      this.results = JSON.parse(JSON.stringify(newState.results));
    } catch (error) {
      Logger.error("Failed to update state:", error);
    }
  };

  constructor() {
    const container = document.querySelector("#game-keyboard-container");
    if (!container) {
      throw new Error("Game keyboard container not found");
    }
    this.keyboardElement = container as HTMLElement;

    this.createKeyboard();
    this.setupKeyboardEvents();
    GameStateManager.getInstance().subscribe(this.listener);
  }

  private createKeyboard(): void {
    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
    ];

    this.keyboardElement.innerHTML = "";
    rows.forEach((row) => {
      const rowElement = document.createElement("div");
      rowElement.className = "flex justify-center gap-1 mb-2";

      row.forEach((key) => {
        const button = document.createElement("button");
        button.textContent = key;
        button.className = `key ${key === "ENTER" || key === "BACKSPACE" ? "large" : ""}`;
        button.id = `key-${key}`;

        button.addEventListener("click", () => {
          this.handleKeyClick(key);
        });

        rowElement.appendChild(button);
      });

      this.keyboardElement.appendChild(rowElement);
    });
  }

  private handleKeyClick(key: string): void {
    if (!this.isEnabled) return;

    if (key === "ENTER") {
      this.onEnter();
    } else if (key === "BACKSPACE") {
      this.onBackspace();
    } else {
      this.onKeyPress(key);
    }
  }

  private setupKeyboardEvents(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isEnabled) return;

      if (e.key === "Enter") {
        this.onEnter();
      } else if (e.key === "Backspace") {
        this.onBackspace();
      } else if (e.key.match(/^[a-zA-Z]$/)) {
        this.onKeyPress(e.key.toUpperCase());
      }
    };

    document.addEventListener("keydown", this.keydownHandler);
  }

  updateKeyboard(results: GuessResult[][]): void {
    results.forEach((result) => {
      result.forEach((cell) => {
        const key = document.getElementById(`key-${cell.letter}`);
        if (key) {
          // Remove existing status classes
          key.classList.remove("correct", "present", "absent");

          // Add the appropriate status class
          if (cell.status === "correct") {
            key.classList.add("correct");
          } else if (cell.status === "present" && !key.classList.contains("correct")) {
            key.classList.add("present");
          } else if (cell.status === "absent" && !key.classList.contains("correct") && !key.classList.contains("present")) {
            key.classList.add("absent");
          }
        }
      });
    });
  }

  reset(): void {
    this.createKeyboard();
  }

  enable(): void {
    this.isEnabled = true;
    this.keyboardElement.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }

  disable(): void {
    this.isEnabled = false;
    this.keyboardElement.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
  }

  cleanup(): void {
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = undefined;
    }
    GameStateManager.getInstance().unsubscribe(this.listener);
  }
}

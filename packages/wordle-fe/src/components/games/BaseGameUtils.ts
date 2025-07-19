import { GameState, GuessResult, GuessResultData, InvalidWordData, LetterStatus } from "@types";
import { GameMessage } from "../GameMessage";
import { GameStateManager } from "../GameStateManager";

export class BaseGameUtils {
  /**
   * Show a message to the user
   */
  static showMessage(message: string, type: "info" | "success" | "error" = "info"): void {
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
   * Add a letter to the current guess
   */
  static addLetter(letter: string): void {
    const gameState = GameStateManager.getInstance();
    const state = gameState.getState();
    if (state.isComplete) return;

    if (state.currentGuess.length < 5) {
      gameState.setCurrentGuess(state.currentGuess + letter);
      gameState.updateColumn(state.currentCol + 1);
    }
  }

  /**
   * Delete the last letter from the current guess
   */
  static deleteLetter(): void {
    const gameState = GameStateManager.getInstance();
    const state = gameState.getState();
    if (state.isComplete) return;

    if (state.currentGuess.length > 0) {
      gameState.setCurrentGuess(state.currentGuess.slice(0, -1));
      gameState.updateColumn(state.currentCol - 1);
    }
  }

  /**
   * Submit the current guess. Subclasses can override to provide
   * bespoke behaviour (e.g. send the guess through a socket).
   */
  static submitGuess(): void {
    const gameState = GameStateManager.getInstance();
    const state = gameState.getState();

    if (state.currentGuess.length === 5 && !state.isComplete) {
      // Always emit the guess-submitted event so both single and multiplayer modes can handle it
      gameState.submitGuess(state.currentGuess);
    } else if (state.currentGuess.length < 5) {
      BaseGameUtils.showMessage("Not enough letters", "info");
    }
  }

  static processGuessResultData(data: GuessResultData): void {
    const gameState = GameStateManager.getInstance();

    const result = BaseGameUtils.enrichLetterStatusToGuessResult(data.guess, data.result);
    gameState.addResult(result);
    gameState.addGuess(data.guess);
    gameState.setGameComplete(data.isComplete, data.isWon, data.word);

    if (data.isComplete) {
      if (data.isWon) {
        BaseGameUtils.showMessage("Congratulations! You won!", "success");
      } else {
        BaseGameUtils.showMessage(`Game over! The word was: ${data.word}`, "error");
      }
    }

    gameState.setCurrentGuess("");
    gameState.nextRow();
  }

  /**
   * Common event handler for invalid word
   */
  static handleInvalidWord(data: InvalidWordData): void {
    BaseGameUtils.showMessage(data.message, "error");
    const gameState = GameStateManager.getInstance();
    gameState.setCurrentGuess("");
  }

  /**
   * Common event handler for errors
   */
  static handleError(data: { message: string }): void {
    BaseGameUtils.showMessage(data.message, "error");
  }

  static enrichLetterStatusToGuessResult(guess: string, result: LetterStatus[]): GuessResult[] {
    return result.map((status, index: number) => ({
      letter: guess[index],
      status: status,
    }));
  }

  static gameStateToLetterStatuses(state: GameState): LetterStatus[][] {
    return state.results.map((result) => result.map((letter_entity) => letter_entity.status));
  }
}

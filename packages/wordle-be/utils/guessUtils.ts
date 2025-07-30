import { GuessResultData, LetterStatus } from "@types";
import { wordService } from "../services/wordService";

export interface InvalidWordResult {
  isInvalidWord: true;
  message: string;
  guess: string;
}

/**
 * Validates a guess and returns early result if invalid
 */
export function validateGuess(guess: string): InvalidWordResult | null {
  const upperGuess = guess.toUpperCase();

  if (!wordService.isValidGuess(upperGuess)) {
    return {
      isInvalidWord: true,
      guess: upperGuess,
      message: "Invalid word",
    };
  }

  return null;
}

/**
 * Check guess against target word using Wordle logic
 */
export function checkGuess(word: string, guess: string): LetterStatus[] {
  const result: LetterStatus[] = [];
  const wordLetters = word.split("");
  const guessLetters = guess.split("");

  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === wordLetters[i]) {
      result[i] = 'c';
    } else if (wordLetters.includes(guessLetters[i])) {
      result[i] = "p";
    } else {
      result[i] = "a";
    }
  }

  return result;
}

export function processGuessCore(targetWord: string, guess: string, currentGuesses: string[], maxGuesses: number = 6): GuessResultData {
  if (guess.length !== 5) {
    throw new Error("Guess must be 5 letters");
  }

  const upperGuess = guess.toUpperCase();

  const result = checkGuess(targetWord, upperGuess);
  const isWon = upperGuess === targetWord;
  const isComplete = isWon || currentGuesses.length + 1 >= maxGuesses;

  return {
    guess: upperGuess,
    result,
    isComplete,
    isWon,
    word: isComplete ? targetWord : undefined,
  };
}

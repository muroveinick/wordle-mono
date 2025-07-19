import { ANSWER_WORDS, getRandomAnswerWord } from "../data/answerWords";
import { VALID_WORDS, isValidWord } from "../data/validWords";

export class WordService {
  private static instance: WordService;
  private answerWords: string[];
  private validWords: Set<string>;

  private constructor() {
    this.answerWords = [...ANSWER_WORDS];
    this.validWords = VALID_WORDS;
  }

  public static getInstance(): WordService {
    if (!WordService.instance) {
      WordService.instance = new WordService();
    }
    return WordService.instance;
  }

  /**
   * Get a random word that can be used as an answer
   */
  public getRandomAnswerWord(): string {
    return getRandomAnswerWord();
  }

  /**
   * Check if a word is valid for guessing
   */
  public isValidGuess(word: string): boolean {
    if (!word || word.length !== 5) {
      return false;
    }
    return isValidWord(word);
  }

  /**
   * Get all valid words (for debugging/testing)
   */
  public getAllValidWords(): string[] {
    return Array.from(this.validWords);
  }

  /**
   * Get all answer words (for debugging/testing)
   */
  public getAllAnswerWords(): string[] {
    return [...this.answerWords];
  }

  /**
   * Get word statistics
   */
  public getWordStats(): {
    totalValidWords: number;
    totalAnswerWords: number;
  } {
    return {
      totalValidWords: this.validWords.size,
      totalAnswerWords: this.answerWords.length,
    };
  }
}

// Export singleton instance
export const wordService = WordService.getInstance();

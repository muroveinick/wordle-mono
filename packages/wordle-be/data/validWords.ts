import words from "./words";

// Valid words that can be guessed (includes all answer words + additional valid guesses)
export const VALID_WORDS = new Set(words);

export const isValidWord = (word: string): boolean => {
  return VALID_WORDS.has(word.toLowerCase());
};

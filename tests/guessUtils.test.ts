import { checkGuess } from '../packages/wordle-be/utils/guessUtils';

// Simple test runner for checkGuess function
function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error}`);
  }
}

function expect(actual: any) {
  return {
    toEqual: (expected: any) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
      }
    }
  };
}

// Test cases for checkGuess function
test('should mark all correct letters', () => {
  const result = checkGuess('ROBOT', 'ROBOT');
  expect(result).toEqual(['c', 'c', 'c', 'c', 'c']);
});

test('should mark letters not in word as absent', () => {
  const result = checkGuess('ROBOT', 'SPIKE');
  expect(result).toEqual(['a', 'a', 'a', 'a', 'a']);
});

test('should handle repeated letters correctly - only one instance available', () => {
  const result = checkGuess('ROBIT', 'BOOST');
  expect(result).toEqual(['p', 'c', 'a', 'a', 'c']);
});

test('should handle repeated letters correctly - multiple instances available', () => {
  const result = checkGuess('HELLO', 'LLAMA');
  expect(result).toEqual(['p', 'p', 'a', 'a', 'a']);
});

test('should prioritize correct position over present', () => {
  const result = checkGuess('SPEED', 'ERASE');
  expect(result).toEqual(['p', 'a', 'a', 'p', 'p']);
});

test('should handle word with all same letters', () => {
  const result = checkGuess('AAAAA', 'AABBB');
  expect(result).toEqual(['c', 'c', 'a', 'a', 'a']);
});

test('should handle complex repeated letter scenario', () => {
  const result = checkGuess('ALLEY', 'LLAMA');
  expect(result).toEqual(['p', 'c', 'p', 'a', 'a']);
});

test('should handle no repeated letters in guess but repeated in word', () => {
  const result = checkGuess('HELLO', 'WORLD');
  expect(result).toEqual(['a', 'p', 'a', 'c', 'a']);
});

test('should handle triple letter scenario', () => {
  const result = checkGuess('GLASS', 'SASSY');
  expect(result).toEqual(['p', 'p', 'a', 'c', 'a']);
});

test('should handle all letters present but wrong positions', () => {
  const result = checkGuess('HORSE', 'SHORE');
  expect(result).toEqual(['p', 'p', 'p', 'p', 'c']);
});

test('should handle partial match with repeated letters', () => {
  const result = checkGuess('BOOKS', 'STOCK');
  expect(result).toEqual(['p', 'a', 'c', 'a', 'p']);
});

test('should handle word where guess has more instances than target', () => {
  const result = checkGuess('ABOUT', 'BOOOO');
  expect(result).toEqual(['p', 'a', 'c', 'a', 'a']);
});

test('should handle edge case with all different letters', () => {
  const result = checkGuess('TRAIN', 'MUSIC');
  expect(result).toEqual(['a', 'a', 'a', 'c', 'a']);
});

test('should handle double letters in both word and guess', () => {
  const result = checkGuess('MUMMY', 'MOMMY');
  expect(result).toEqual(['c', 'a', 'c', 'c', 'c']);
});

test('should handle complex vowel scenario', () => {
  const result = checkGuess('AUDIO', 'OUTED');
  expect(result).toEqual(['p', 'c', 'a', 'a', 'p']);
});

// Run all tests
console.log('Running checkGuess tests...\n');
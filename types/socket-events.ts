import { SharedPlayer } from "./shared-game-types";
import { LetterStatus } from "./types";

export interface GameStartedData {
  gameId: string;
  guesses: string[];
  results: LetterStatus[][];
}

export interface GuessResultData {
  guess: string;
  result: LetterStatus[];
  isComplete: boolean;
  isWon: boolean;
  word?: string;
}

export interface ErrorData {
  message: string;
}

export interface InvalidWordData {
  guess: string;
  message: string;
}

export interface StartGameData {
  playerId: string;
}

export interface MakeGuessData {
  gameId: string;
  guess: string;
}

export interface SharedGameCreatedData {
  gameId: string;
  word?: string;
  players: SharedPlayer[];
}

export interface SharedGameJoinedData {
  gameId: string;
  players: SharedPlayer[];
  currentPlayer: SharedPlayer;
}

export interface SharedGamePlayerJoinedData {
  gameId: string;
  player: SharedPlayer;
}

export interface SharedGamePlayerLeftData {
  gameId: string;
  userId: string;
  username: string;
}

export interface SharedGamePlayerGuessData {
  gameId: string;
  player: SharedPlayer;
  guess: string;
  result: LetterStatus[];
}

export interface SharedGameLeftData {
  gameId: string;
}

export interface SharedGameJoinData {
  gameId: string;
}

export interface SharedGameGuessData {
  gameId: string;
  guess: string;
}

export interface SharedGameLeaveData {
  gameId: string;
}

export interface SharedGamePlayerOnlineData {
  gameId: string;
  userId: string;
  username: string;
}

export interface SharedGamePlayerOfflineData {
  gameId: string;
  userId: string;
  username: string;
}

export interface ServerToClientEvents {
  // Single Player Events
  "game-started": (data: GameStartedData) => void;
  "guess-result": (data: GuessResultData) => void;
  "invalid-word": (data: InvalidWordData) => void;
  error: (data: ErrorData) => void;

  // Shared Game Events
  "shared-game-created": (data: SharedGameCreatedData) => void;
  "shared-game-joined": (data: SharedGameJoinedData) => void;
  "shared-game-player-joined": (data: SharedGamePlayerJoinedData) => void;
  "shared-game-player-left": (data: SharedGamePlayerLeftData) => void;
  "shared-game-player-went-online": (data: SharedGamePlayerOnlineData) => void;
  "shared-game-player-went-offline": (data: SharedGamePlayerOfflineData) => void;
  "shared-game-guess-result": (data: GuessResultData) => void;
  "shared-game-player-guess": (data: SharedGamePlayerGuessData) => void;
  "shared-game-left": (data: SharedGameLeftData) => void;
}

export interface ClientToServerEvents {
  // Single Player Events
  "start-game": (data: StartGameData) => void;
  "make-guess": (data: MakeGuessData) => void;
  "shared-game-player-went-offline": () => void;

  // Shared Game Events
  "shared-game-create": () => void;
  "shared-game-join": (data: SharedGameJoinData) => void;
  "shared-game-guess": (data: SharedGameGuessData) => void;
  "shared-game-leave": (data: SharedGameLeaveData) => void;
}

export interface GetGameResponse {
  gameId: string;
  guesses: string[];
  results: string[][];
  isComplete: boolean;
  isWon: boolean;
  word?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserShort {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: UserShort;
}

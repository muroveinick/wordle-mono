import { GetGameResponse } from "@types";
import { authService } from "./authService";
import { EnvService } from "./envService";

const API_BASE_URL = EnvService.getGameBaseUrl();

export class ApiService {
  async getGameById(gameId: string): Promise<GetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/${gameId}`, {
      headers: authService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch game: ${response.status}`);
    }

    return response.json();
  }

  async startGame(): Promise<{ gameId: string; guesses: string[]; results: string[][] }> {
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to start game: ${response.status}`);
    }

    return response.json();
  }

  async makeGuess(gameId: string, guess: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/guess`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ gameId, guess }),
    });

    if (!response.ok) {
      throw new Error(`Failed to make guess: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();

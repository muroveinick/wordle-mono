import { AuthResponse, LoginRequest, RegisterRequest, UserShort } from "@types";
import { EnvService } from "./envService";
import { Router } from "./router";

const API_BASE_URL = EnvService.getAuthBaseUrl();

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: UserShort | null = null;

  static get user(): UserShort | null {
    return this.instance?.user;
  }

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem("auth_token");
    const userJson = localStorage.getItem("auth_user");

    if (token && userJson) {
      this.token = token;
      this.user = JSON.parse(userJson);
    }
  }

  private saveToStorage(): void {
    if (this.token && this.user) {
      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("auth_user", JSON.stringify(this.user));
    }
  }

  private clearStorage(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const authResponse: AuthResponse = await response.json();
    this.token = authResponse.token;
    this.user = authResponse.user;
    this.saveToStorage();

    return authResponse;
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const authResponse: AuthResponse = await response.json();
    this.token = authResponse.token;
    this.user = authResponse.user;
    this.saveToStorage();

    return authResponse;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    this.clearStorage();
  }

  async verifyToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.user = data.user;
      this.saveToStorage();
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): UserShort | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  getAuthHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  handleExpiredToken(): void {
    this.logout();
    Router.getInstance().navigate("/", true);
  }
}

export const authService = AuthService.getInstance();

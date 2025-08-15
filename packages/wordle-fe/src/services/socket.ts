import { io, Socket } from "socket.io-client";
import { Logger } from "../utils/logger";
import { authService } from "./authService";
import { EnvService } from "./envService";

let _socketService: SocketService | null = null;
export function setSocket(instance: SocketService | null): void {
  Logger.log("Setting socket service");
  _socketService = instance;
}

export function getSocket(): SocketService {
  if (!_socketService) {
    throw new Error("Service has not been initialised yet");
  }
  return _socketService;
}

export class SocketService {
  private socket: Socket | null = null;

  constructor() {
    // No need to generate playerId anymore, we'll use authenticated user
  }

  connect(): void {
    if (this.socket) {
      this.disconnect();
      this.socket = null;
    }

    const token = authService.getToken();
    const url = EnvService.getApiBaseUrl();
    this.socket = io(url, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: token ? { token } : undefined,
    });

    this.socket.on("connect", () => {
      Logger.warn("Connected to server");
    });

    this.socket.on("disconnect", () => {
      Logger.log("Disconnected from server");
    });

    this.socket.on("connect_error", (error) => {
      Logger.error("Socket connection error:", error);
      if (error?.message?.includes("authentication") || error?.message?.includes("401") || error?.message?.includes("403")) {
        authService.handleExpiredToken();
      }
    });

    this.socket.on("error", (error) => {
      Logger.error("Socket error:", error);
      if (error?.message?.includes("authentication failed") || error?.message?.includes("Socket authentication failed")) {
        authService.handleExpiredToken();
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startGame(): void {
    if (this.socket) {
      const user = authService.getUser();
      if (user) {
        this.socket.emit("start-game", { playerId: user.id });
      }
    }
  }

  makeGuess(gameId: string, guess: string, roomId?: string): void {
    if (this.socket) {
      this.socket.emit("make-guess", { gameId, guess, roomId });
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getPlayerId(): string {
    const user = authService.getUser();
    return user ? user.id : "";
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.isConnected()) {
      Logger.log("Already connected");

      return true;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);

      this.socket?.once("connect", () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  emit(event: string, data?: any): void {
    Logger.warn(!!this.socket, event, data);

    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

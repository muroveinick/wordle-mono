export class EnvService {
  private static getEnvVar(key: keyof ImportMetaEnv, defaultValue: string): string {
    return import.meta.env[key] || defaultValue;
  }

  static getApiBaseUrl(): string {
    return this.getEnvVar("VITE_API_BASE_URL", "http://localhost:5000");
  }

  static getAuthBaseUrl(): string {
    return `${this.getApiBaseUrl()}/api/auth`;
  }

  static getGameBaseUrl(): string {
    return `${this.getApiBaseUrl()}/api/game`;
  }
}

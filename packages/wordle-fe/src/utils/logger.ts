
/**
 * Logging wrapper that conditionally logs based on NODE_ENV
 * - In production: only logs errors
 * - In non-production: logs everything
 */
export class Logger {
  private static isProduction(): boolean {
    return import.meta.env.MODE === "production";
  }

  static log(...args: any[]): void {
    if (!this.isProduction()) {
      console.log(...args);
    }
  }

  static info(...args: any[]): void {
    if (!this.isProduction()) {
      console.info(...args);
    }
  }

  static warn(...args: any[]): void {
    if (!this.isProduction()) {
      console.warn(...args);
    }
  }

  static error(...args: any[]): void {
    console.error(...args);
  }

  static debug(...args: any[]): void {
    if (!this.isProduction()) {
      console.debug(...args);
    }
  }

  static table(data: any): void {
    if (!this.isProduction()) {
      console.table(data);
    }
  }

  static group(label?: string): void {
    if (!this.isProduction()) {
      console.group(label);
    }
  }

  static groupEnd(): void {
    if (!this.isProduction()) {
      console.groupEnd();
    }
  }
}

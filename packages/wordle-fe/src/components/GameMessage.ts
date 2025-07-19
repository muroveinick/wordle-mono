export class GameMessage {
  private messageElement: HTMLElement;
  private currentTimeout: number | null = null;

  constructor(containerSelector: string = "body") {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found for selector: ${containerSelector}`);
    }
    
    const ribbon = document.createElement("div");
    ribbon.className = "ribbon";
    container.appendChild(ribbon);
    this.messageElement = ribbon;
  }

  /**
   * Generic display helper used by the typed helpers below.
   */
  private display(message: string, bgClass: string, duration: number = 3000): void {
    this.messageElement.textContent = message;
    this.messageElement.className = `ribbon ${bgClass}`;
    this.messageElement.hidden = false;

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    this.currentTimeout = window.setTimeout(() => {
      this.clear();
    }, duration);
  }

  info(message: string, duration: number = 3000): void {
    this.display(message, "info", duration);
  }

  success(message: string, duration: number = 3000): void {
    this.display(message, "success", duration);
  }

  error(message: string, duration: number = 3000): void {
    this.display(message, "error", duration);
  }

  clear(): void {
    this.messageElement.textContent = "";
    this.messageElement.hidden = true;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  cleanup(): void {
    this.clear();
  }
}

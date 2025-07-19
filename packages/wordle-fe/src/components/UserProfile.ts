import { authService } from "../services/authService";
import { UserShort } from "@types";

export class UserProfile {
  private container: HTMLElement;
  private user: UserShort | null = null;
  private onLogout?: () => void;

  constructor(container: HTMLElement, onLogout?: () => void) {
    this.container = container;
    this.onLogout = onLogout;
    this.user = authService.getUser();
    this.render();
  }

  private render(): void {
    if (!this.user) {
      this.container.innerHTML = "";
      return;
    }

    this.container.innerHTML = `
      <div class="user-profile">
        <div class="user-info">
          <span class="username">Welcome, ${this.user.username}!</span>
          <button id="logout-btn" class="logout-button">Logout</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const logoutBtn = this.container.querySelector("#logout-btn") as HTMLButtonElement;

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await authService.logout();
        this.user = null;
        this.render();
        this.onLogout?.();
      });
    }
  }

  public updateUser(user: UserShort): void {
    this.user = user;
    this.render();
  }

  public show(): void {
    this.container.style.display = "block";
  }

  public hide(): void {
    this.container.style.display = "none";
  }
}

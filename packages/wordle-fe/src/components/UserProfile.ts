import { UserShort } from "@types";
import { authService } from "../services/authService";

export class UserProfile {
  private user: UserShort | null = null;

  constructor(private container: HTMLElement, private onLogout?: () => void) {
    this.user = authService.getUser();
    this.render();
  }

  private render(): void {
    if (!this.user) {
      this.container.innerHTML = "";
      return;
    }

    this.container.innerHTML = `
      <div class="user-info">
        <span class="username">Welcome, ${this.user.username}!</span>
        <button id="logout-btn" class="logout-button">Logout</button>
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

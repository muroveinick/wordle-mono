import { LoginRequest, RegisterRequest } from "@types";
import { authService } from "../services/authService";

export class AuthForm {
  private container: HTMLElement;
  private isLoginMode: boolean = true;
  private onAuthSuccess: (user: any) => void;

  constructor(container: HTMLElement, onAuthSuccess: (user: any) => void) {
    this.container = container;
    this.onAuthSuccess = onAuthSuccess;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-form">
          <h2>${this.isLoginMode ? "Login" : "Register"}</h2>
          <form id="auth-form">
            ${
              !this.isLoginMode
                ? `
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
              </div>
            `
                : ""
            }
            <div class="form-group">
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
            </div>
            ${
              !this.isLoginMode
                ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
              </div>
            `
                : ""
            }
            <button type="submit" class="auth-button">
              ${this.isLoginMode ? "Login" : "Register"}
            </button>
          </form>
          <p class="auth-toggle">
            ${this.isLoginMode ? "Don't have an account?" : "Already have an account?"}
            <button type="button" id="toggle-mode">
              ${this.isLoginMode ? "Register" : "Login"}
            </button>
          </p>
          <div id="auth-error" class="error-message"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const form = this.container.querySelector("#auth-form") as HTMLFormElement;
    const toggleButton = this.container.querySelector("#toggle-mode") as HTMLButtonElement;
    const errorDiv = this.container.querySelector("#auth-error") as HTMLDivElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;
      const email = formData.get("email") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      try {
        errorDiv.textContent = "";

        if (this.isLoginMode) {
          const loginData: LoginRequest = { username, password };
          const response = await authService.login(loginData);
          this.onAuthSuccess(response.user);
        } else {
          // Validate password confirmation
          if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
          }

          const registerData: RegisterRequest = { username, email, password };
          const response = await authService.register(registerData);
          this.onAuthSuccess(response.user);
        }
      } catch (error: any) {
        errorDiv.textContent = error.message || "Authentication failed";
      }
    });

    toggleButton.addEventListener("click", () => {
      this.isLoginMode = !this.isLoginMode;
      this.render();
    });
  }

  public show(): void {
    this.container.style.display = "block";
  }

  public hide(): void {
    this.container.style.display = "none";
  }
}

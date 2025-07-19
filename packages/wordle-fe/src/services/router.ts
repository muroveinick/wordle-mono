export class Router {
  private routes: Map<string, (params: any) => void> = new Map();

  constructor() {
    window.addEventListener("popstate", () => {
      this.handleRoute();
    });
  }

  private static _instance: Router | null;

  static getInstance() {
    if (!Router._instance) {
      Router._instance = new Router();
    }
    return Router._instance;
  }

  addRoute(pattern: string, handler: (params: any) => void): void {
    this.routes.set(pattern, handler);
  }

  navigate(path: string, replace: boolean = false): void {
    if (replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    this.handleRoute();
  }

  private handleRoute(): void {
    const path = window.location.pathname;

    // Try to match routes
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path);
      if (params !== null) {
        handler(params);
        return;
      }
    }

    // Default route if no match
    if (this.routes.has("*")) {
      this.routes.get("*")!({});
    }
  }

  private matchRoute(pattern: string, path: string): any | null {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: any = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(":")) {
        // Dynamic parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null;
      }
    }

    return params;
  }

  start(): void {
    this.handleRoute();
  }

  getCurrentGameId(): string | null {
    const path = window.location.pathname;
    const match = path.match(/^\/games\/([^\/]+)$/);
    return match ? match[1] : null;
  }

  getCurrentSharedGameId(): string | null {
    const path = window.location.pathname;
    const match = path.match(/^\/shared\/([^\/]+)$/);
    return match ? match[1] : null;
  }
}

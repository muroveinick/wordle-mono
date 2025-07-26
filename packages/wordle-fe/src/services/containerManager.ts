export enum ContainerType {
  GAME_CONTENT = "game-content",
  BASIC_GAME_CONTAINER = "basic-game-container",
  SHARED_GAME_CONTAINER = "shared-game-container",
  GAME_FOOTER = "game-footer",
  AUTH_CONTAINER = "auth-container"
}

export type ViewState = "home" | "singlePlayer" | "sharedGame" | "auth";

export class ContainerManager {
  private containers: Map<ContainerType, HTMLElement> = new Map();
  private static instance: ContainerManager;

  private constructor() {
    this.initializeContainers();
  }

  static getInstance(): ContainerManager {
    if (!ContainerManager.instance) {
      ContainerManager.instance = new ContainerManager();
    }
    return ContainerManager.instance;
  }

  private initializeContainers(): void {
    Object.values(ContainerType).forEach(containerId => {
      const element = document.getElementById(containerId);
      if (!element) {
        throw new Error(`Container with id '${containerId}' not found`);
      }
      this.containers.set(containerId, element);
    });
  }

  private getContainer(type: ContainerType): HTMLElement {
    const container = this.containers.get(type);
    if (!container) {
      throw new Error(`Container '${type}' not initialized`);
    }
    return container;
  }

  showContainer(type: ContainerType): void {
    console.log("Showing container", type);
    this.getContainer(type).style.display = "block";
  }

  hideContainer(type: ContainerType): void {
    console.log("Hiding container", type);
    this.getContainer(type).style.display = "none";
  }

  hideAllContainers(): void {
    console.warn("Hiding all containers");
    this.containers.forEach(container => {
      container.style.display = "none";
    });
  }

  setViewState(state: ViewState): void {
    this.hideAllContainers();
    
    switch (state) {
      case "home":
        this.showContainer(ContainerType.GAME_CONTENT);
        this.showContainer(ContainerType.GAME_FOOTER);
        break;
      
      case "singlePlayer":
        this.showContainer(ContainerType.BASIC_GAME_CONTAINER);
        this.showContainer(ContainerType.GAME_FOOTER);
        break;
      
      case "sharedGame":
        this.showContainer(ContainerType.SHARED_GAME_CONTAINER);
        this.showContainer(ContainerType.GAME_FOOTER);
        break;
      
      case "auth":
        this.showContainer(ContainerType.AUTH_CONTAINER);
        break;
    }
  }

  isContainerVisible(type: ContainerType): boolean {
    return this.getContainer(type).style.display !== "none";
  }
}
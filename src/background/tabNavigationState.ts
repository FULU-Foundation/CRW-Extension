export class TabNavigationState {
  private readonly generations = new Map<number, number>();

  capture(tabId: number): number {
    return this.generations.get(tabId) ?? 0;
  }

  beginNavigation(tabId: number): number {
    const generation = this.capture(tabId) + 1;
    this.generations.set(tabId, generation);
    return generation;
  }

  isCurrent(tabId: number, generation: number): boolean {
    return this.capture(tabId) === generation;
  }

  forget(tabId: number): void {
    this.generations.delete(tabId);
  }
}

export const isCurrentPageUrl = (
  payloadUrl: string,
  currentTabUrl: string | undefined,
): boolean => currentTabUrl === payloadUrl;

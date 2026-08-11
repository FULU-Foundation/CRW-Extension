export const createUrlChangeDetector = (
  initialUrl: string,
): ((currentUrl: string) => boolean) => {
  let previousUrl = initialUrl;

  return (currentUrl: string): boolean => {
    if (currentUrl === previousUrl) return false;
    previousUrl = currentUrl;
    return true;
  };
};

interface UrlChangeDebouncerOptions {
  initialUrl: string;
  delayMs: number;
  onUrlChange?: () => void;
  onRefresh: () => void;
  setTimer: (callback: () => void, delayMs: number) => number;
  clearTimer: (timer: number) => void;
}

export const createUrlChangeDebouncer = ({
  initialUrl,
  delayMs,
  onUrlChange,
  onRefresh,
  setTimer,
  clearTimer,
}: UrlChangeDebouncerOptions): ((currentUrl: string) => void) => {
  const hasUrlChanged = createUrlChangeDetector(initialUrl);
  let pendingRefresh: number | null = null;

  return (currentUrl: string): void => {
    const urlChanged = hasUrlChanged(currentUrl);
    if (!urlChanged && pendingRefresh === null) return;
    if (urlChanged) onUrlChange?.();

    if (pendingRefresh !== null) {
      clearTimer(pendingRefresh);
    }

    pendingRefresh = setTimer(() => {
      pendingRefresh = null;
      onRefresh();
    }, delayMs);
  };
};

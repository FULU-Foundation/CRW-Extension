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

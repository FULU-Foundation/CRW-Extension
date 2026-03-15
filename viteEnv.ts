export type TargetBrowser = "chrome" | "firefox" | "safari";

const targetBrowser = process.env.BROWSER;

export const browser: TargetBrowser =
  targetBrowser === "firefox"
    ? "firefox"
    : targetBrowser === "safari"
      ? "safari"
      : "chrome";

export const isFirefox = browser === "firefox";
export const isChrome = browser === "chrome";
export const isSafari = browser === "safari";

export function getOutDir() {
  return `dist/${browser}`;
}

export function getManifestSrc() {
  if (isFirefox) return "manifest/firefox.json";
  if (isSafari) return "manifest/safari.json";
  return "manifest/chrome.json";
}

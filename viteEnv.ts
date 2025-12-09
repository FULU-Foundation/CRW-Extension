export type TargetBrowser = "chrome" | "firefox";

export const browser: TargetBrowser =
  process.env.BROWSER === "firefox" ? "firefox" : "chrome";

export const isFirefox = browser === "firefox";
export const isChrome = browser === "chrome";

export function getOutDir() {
  return `dist/${browser}`;
}

export function getManifestSrc() {
  return isFirefox ? "manifest/firefox.json" : "manifest/chrome.json";
}

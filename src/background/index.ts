// /src/background/index.ts
import browser from "webextension-polyfill";
import { hasArticle } from "@/lib/client";
import type { CheckUrlMsg } from "@/lib/messaging";

async function setCount(count: number) {
  try {
    await browser.action.setBadgeBackgroundColor({ color: "#1DFDC0" });
    await browser.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  } catch {}
}

browser.runtime.onInstalled.addListener(() => {
  console.log("background > index.ts > browser.runtime.onInstalled: Extension installed!")
})

browser.tabs.onActivated.addListener((activeInfo) => {
  console.log("background > index.ts > browser.tabs.onActivated:", {activeInfo})
})

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("background > index.ts > browser.tabs.onActivated:", {tabId, changeInfo, tab})
})

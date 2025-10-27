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

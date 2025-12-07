// /src/background/index.ts
import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import * as Matching from "@/lib/search/matching";
import * as Dataset from "@/lib/dataset";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { CargoEntry, PageContext } from "@/shared/types";

browser.runtime.onInstalled.addListener(async () => {
  console.log(`${Constants.LOG_PREFIX} Extension installed/updated. Loading dataset...`);

  try {
    Dataset.load();
  } catch (error) {
    console.log(`${Constants.LOG_PREFIX} Dataset load failed`, error)
  }
})

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  console.log(`${Constants.LOG_PREFIX} Active tab has been changed. TabId:${tabId}`);

  const storageKey = Constants.STORAGE.MATCHES(tabId);
  const stored = await browser.storage.local.get(storageKey);
  const results = stored[storageKey] as CargoEntry[] || [];

  browser.action.setBadgeText({ tabId, text: String(results.length > 3 ? '3+' : results.length) });
  browser.action.setBadgeBackgroundColor({ tabId, color: '#FF5722' });
})

Messaging.createBackgroundMessageHandler({
  async onPageContextUpdated(payload, sender) {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const { url } = payload;

    const data = await browser.storage.local.get([Constants.STORAGE.ALL]);
    const dataset = data[Constants.STORAGE.ALL] as any[] || [];

    const matches = Matching.matchByUrl(dataset, url);

    await browser.storage.local.set({
      [Constants.STORAGE.MATCHES(tabId)]: matches
    });

    browser.action.setBadgeText({ tabId, text: String(matches.length > 3 ? '3+' : matches.length) });
    browser.action.setBadgeBackgroundColor({ tabId, color: '#FF5722' });
  }
})
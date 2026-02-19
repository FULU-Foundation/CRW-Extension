// /src/background/index.ts
import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import * as Matching from "@/lib/matching/matching";
import * as Dataset from "@/lib/dataset";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { CargoEntry } from "@/shared/types";

let datasetCache: CargoEntry[] = [];
let datasetLoadPromise: Promise<CargoEntry[]> | null = null;

const sendMatchUpdateToTab = async (
  tabId: number,
  matches: CargoEntry[],
  type: MessageType = MessageType.MATCH_RESULTS_UPDATED,
  attempt = 0,
): Promise<void> => {
  try {
    await browser.tabs.sendMessage(
      tabId,
      Messaging.createMessage(type, "backgroud", matches),
    );
  } catch {
    if (attempt >= 2) return;
    const delayMs = 250 * (attempt + 1);
    setTimeout(() => {
      void sendMatchUpdateToTab(tabId, matches, type, attempt + 1);
    }, delayMs);
  }
};

const loadDatasetCache = async (): Promise<CargoEntry[]> => {
  if (datasetCache.length > 0) return datasetCache;
  if (datasetLoadPromise) return datasetLoadPromise;

  datasetLoadPromise = (async () => {
    const loaded = await Dataset.load();
    datasetCache = loaded.all;
    return datasetCache;
  })();

  try {
    return await datasetLoadPromise;
  } catch (error) {
    console.log(`${Constants.LOG_PREFIX} Dataset load failed`, error);
    datasetCache = [];
    return datasetCache;
  } finally {
    datasetLoadPromise = null;
  }
};

browser.runtime.onInstalled.addListener(async () => {
  console.log(
    `${Constants.LOG_PREFIX} Extension installed/updated. Loading dataset...`,
  );

  await loadDatasetCache();
});

browser.runtime.onStartup.addListener(async () => {
  await loadDatasetCache();
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  console.log(
    `${Constants.LOG_PREFIX} Active tab has been changed. TabId:${tabId}`,
  );

  const storageKey = Constants.STORAGE.MATCHES(tabId);
  const stored = await browser.storage.local.get(storageKey);
  const results = (stored[storageKey] as CargoEntry[]) || [];

  browser.action.setBadgeText({
    tabId,
    text: String(results.length > 3 ? "3+" : results.length),
  });
  browser.action.setBadgeBackgroundColor({ tabId, color: "#FF5722" });
});

browser.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  if (!tabId) return;

  const storageKey = Constants.STORAGE.MATCHES(tabId);
  const stored = await browser.storage.local.get(storageKey);
  const matches = (stored[storageKey] as CargoEntry[]) || [];

  void sendMatchUpdateToTab(
    tabId,
    matches,
    MessageType.FORCE_SHOW_INLINE_POPUP,
  );
});

Messaging.createBackgroundMessageHandler({
  async onPageContextUpdated(payload, sender) {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    const dataset = await loadDatasetCache();
    const storageKey = Constants.STORAGE.MATCHES(tabId);

    const matches = Matching.matchByPageContext(dataset, payload);

    await browser.storage.local.set({
      [storageKey]: matches,
    });

    browser.action.setBadgeText({
      tabId,
      text: String(matches.length > 3 ? "3+" : matches.length),
    });
    browser.action.setBadgeBackgroundColor({ tabId, color: "#FF5722" });

    void sendMatchUpdateToTab(tabId, matches);
  },
});

void loadDatasetCache();

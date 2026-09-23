// /src/background/index.ts
import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import * as Matching from "@/lib/matching/matching";
import * as Dataset from "@/lib/dataset";
import * as Messaging from "@/messaging";
import { type AnyCRWMessage, MessageType } from "@/messaging/type";
import { CargoEntry } from "@/shared/types";
import { readDatasetCacheRefreshInfo } from "@/shared/storage";
import {
  isShortcutCommandName,
  type ShortcutCommandName,
} from "@/shared/shortcuts";
import {
  clearObsoleteLocalCaches,
  clearTabMatches,
  readTabMatches,
  removeTabMatches,
  writeTabMatches,
} from "@/shared/tabMatchCache";
import { isCurrentPageUrl, TabNavigationState } from "./tabNavigationState";

let datasetCache: CargoEntry[] = [];
let datasetLoadPromise: Promise<CargoEntry[]> | null = null;
let nextDatasetRefreshCheckAt = 0;
const tabNavigationState = new TabNavigationState();
const navigationCleanups = new Map<number, Promise<void>>();

const readCachedTabMatches = async (tabId: number): Promise<CargoEntry[]> => {
  try {
    return await readTabMatches(browser.storage.session, tabId);
  } catch (error) {
    console.warn(
      `${Constants.LOG_PREFIX} Failed to read cached tab matches`,
      error,
    );
    return [];
  }
};

const cacheTabMatches = async (
  tabId: number,
  matches: CargoEntry[],
): Promise<void> => {
  try {
    await writeTabMatches(browser.storage.session, tabId, matches);
  } catch (error) {
    // Match delivery and badge updates must not depend on cache availability.
    console.warn(`${Constants.LOG_PREFIX} Failed to cache tab matches`, error);
  }
};

const removeCachedTabMatches = async (tabId: number): Promise<void> => {
  try {
    await removeTabMatches(browser.storage.session, tabId);
  } catch (error) {
    console.warn(
      `${Constants.LOG_PREFIX} Failed to remove cached tab matches`,
      error,
    );
  }
};

const waitForNavigationCleanup = async (tabId: number): Promise<void> => {
  await navigationCleanups.get(tabId);
};

const getBadgeText = (count: number): string => {
  if (count <= 0) return "";
  if (count > 3) return "3+";
  return String(count);
};

const sendMessageToTab = async (
  tabId: number,
  message: AnyCRWMessage,
  attempt = 0,
): Promise<void> => {
  try {
    await browser.tabs.sendMessage(tabId, message);
  } catch {
    if (attempt >= 2) return;
    const delayMs = 250 * (attempt + 1);
    setTimeout(() => {
      void sendMessageToTab(tabId, message, attempt + 1);
    }, delayMs);
  }
};

const sendMatchResultsToTab = async (
  tabId: number,
  matches: CargoEntry[],
): Promise<void> => {
  try {
    await browser.tabs.sendMessage(
      tabId,
      Messaging.createMessage(
        MessageType.MATCH_RESULTS_UPDATED,
        "background",
        matches,
      ),
    );
  } catch {
    // A failed match update means the page is no longer available. Its next
    // content-script context update will calculate and deliver fresh matches.
  }
};

const readActiveTabId = async (): Promise<number | null> => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0]?.id ?? null;
};

const handleShortcutCommand = async (
  command: ShortcutCommandName,
): Promise<void> => {
  const tabId = await readActiveTabId();
  if (!tabId) return;

  if (command === "hide-inline-popup") {
    void sendMessageToTab(
      tabId,
      Messaging.createMessage(MessageType.HIDE_INLINE_POPUP, "background"),
    );
    return;
  }

  const navigationGeneration = tabNavigationState.capture(tabId);
  await waitForNavigationCleanup(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  const matches = await readCachedTabMatches(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  switch (command) {
    case "show-inline-popup":
      void sendMessageToTab(
        tabId,
        Messaging.createMessage(
          MessageType.FORCE_SHOW_INLINE_POPUP,
          "background",
          matches,
        ),
      );
      break;
    case "toggle-site-snooze":
      void sendMessageToTab(
        tabId,
        Messaging.createMessage(
          MessageType.TOGGLE_SNOOZE_CURRENT_SITE,
          "background",
          matches,
        ),
      );
      break;
    case "toggle-site-ignore":
      void sendMessageToTab(
        tabId,
        Messaging.createMessage(
          MessageType.TOGGLE_SUPPRESS_CURRENT_SITE,
          "background",
          matches,
        ),
      );
      break;
  }
};

const readDatasetRefreshInfo = async (): Promise<{
  fetchedAt: number | null;
  lastCheckedAt: number | null;
}> => {
  return await readDatasetCacheRefreshInfo();
};

const loadDatasetCache = async (options?: {
  forceRefresh?: boolean;
}): Promise<CargoEntry[]> => {
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();

  if (
    !forceRefresh &&
    datasetCache.length > 0 &&
    now < nextDatasetRefreshCheckAt
  ) {
    return datasetCache;
  }

  if (datasetLoadPromise) return datasetLoadPromise;

  datasetLoadPromise = (async () => {
    const loaded = forceRefresh
      ? await Dataset.refreshNow()
      : await Dataset.load();
    datasetCache = loaded.all;
    const refreshIntervalMs = await Dataset.readConfiguredRefreshIntervalMs();
    nextDatasetRefreshCheckAt = Date.now() + refreshIntervalMs;
    return datasetCache;
  })();

  try {
    return await datasetLoadPromise;
  } catch (error) {
    console.log(`${Constants.LOG_PREFIX} Dataset load failed`, error);
    nextDatasetRefreshCheckAt = 0;
    if (forceRefresh) throw error;

    datasetCache = [];
    return datasetCache;
  } finally {
    datasetLoadPromise = null;
  }
};

const cleanupCachedStorage = async (): Promise<void> => {
  try {
    await Promise.all([
      // Upgrades from older releases can contain a dataset twice (crw_raw and
      // crw_all) plus an unbounded crw_matched_* key for every historical tab.
      clearObsoleteLocalCaches(browser.storage.local),
      clearTabMatches(browser.storage.session),
    ]);
  } catch (error) {
    console.warn(`${Constants.LOG_PREFIX} Failed to clean cached data`, error);
  }
};

browser.runtime.onInstalled.addListener(async () => {
  console.log(
    `${Constants.LOG_PREFIX} Extension installed/updated. Loading dataset...`,
  );

  await cleanupCachedStorage();
  await loadDatasetCache();
});

browser.runtime.onStartup.addListener(async () => {
  await cleanupCachedStorage();
  await loadDatasetCache();
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes[Constants.STORAGE.DATA_REFRESH_INTERVAL_MS]) {
    nextDatasetRefreshCheckAt = 0;
  }
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  console.log(
    `${Constants.LOG_PREFIX} Active tab has been changed. TabId:${tabId}`,
  );

  const navigationGeneration = tabNavigationState.capture(tabId);
  await waitForNavigationCleanup(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  const results = await readCachedTabMatches(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  browser.action.setBadgeText({
    tabId,
    text: getBadgeText(results.length),
  });
  browser.action.setBadgeBackgroundColor({ tabId, color: "#FF5722" });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "loading") return;

  tabNavigationState.beginNavigation(tabId);
  const cleanup = Promise.all([
    removeCachedTabMatches(tabId),
    browser.action.setBadgeText({ tabId, text: "" }),
  ])
    .then(() => undefined)
    .catch((error) => {
      console.warn(
        `${Constants.LOG_PREFIX} Failed to clear matches during navigation`,
        error,
      );
    })
    .finally(() => {
      if (navigationCleanups.get(tabId) === cleanup) {
        navigationCleanups.delete(tabId);
      }
    });
  navigationCleanups.set(tabId, cleanup);
});

browser.tabs.onRemoved.addListener((tabId) => {
  tabNavigationState.forget(tabId);
  navigationCleanups.delete(tabId);
  void removeCachedTabMatches(tabId);
});

browser.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  if (!tabId) return;

  const navigationGeneration = tabNavigationState.capture(tabId);
  await waitForNavigationCleanup(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  const matches = await readCachedTabMatches(tabId);
  if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

  void sendMessageToTab(
    tabId,
    Messaging.createMessage(
      MessageType.TOGGLE_INLINE_POPUP,
      "background",
      matches,
    ),
  );
});

browser.commands.onCommand.addListener((command) => {
  if (!isShortcutCommandName(command)) return;
  void handleShortcutCommand(command);
});

Messaging.createBackgroundMessageHandler({
  onOpenOptionsPage() {
    return browser.runtime.openOptionsPage();
  },
  async onRefreshDatasetNow() {
    await loadDatasetCache({ forceRefresh: true });
    return await readDatasetRefreshInfo();
  },
  async onPageContextUpdated(payload, sender) {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    const navigationGeneration = tabNavigationState.capture(tabId);
    const [dataset] = await Promise.all([
      loadDatasetCache(),
      waitForNavigationCleanup(tabId),
    ]);

    let currentTab: browser.Tabs.Tab;
    try {
      currentTab = await browser.tabs.get(tabId);
    } catch {
      return;
    }
    if (
      !tabNavigationState.isCurrent(tabId, navigationGeneration) ||
      !isCurrentPageUrl(payload.url, currentTab.url)
    ) {
      return;
    }

    const matches = Matching.matchByPageContext(dataset, payload);

    await cacheTabMatches(tabId, matches);
    if (!tabNavigationState.isCurrent(tabId, navigationGeneration)) return;

    try {
      currentTab = await browser.tabs.get(tabId);
    } catch {
      return;
    }
    if (!isCurrentPageUrl(payload.url, currentTab.url)) return;

    browser.action.setBadgeText({
      tabId,
      text: getBadgeText(matches.length),
    });
    browser.action.setBadgeBackgroundColor({ tabId, color: "#FF5722" });

    void sendMatchResultsToTab(tabId, matches);
  },
});

void loadDatasetCache();

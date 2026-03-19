// /src/background/index.ts
import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import * as Matching from "@/lib/matching/matching";
import * as Dataset from "@/lib/dataset";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { CargoEntry } from "@/shared/types";
import {
  readDatasetCacheRefreshInfo,
  readDisplayMode,
  readTabMatches,
} from "@/shared/storage";
import type { DisplayMode } from "@/shared/constants";

let datasetCache: CargoEntry[] = [];
let datasetLoadPromise: Promise<CargoEntry[]> | null = null;
let nextDatasetRefreshCheckAt = 0;
let currentDisplayMode: DisplayMode = "full-popup";

const getBadgeColor = (count: number): string => {
  if (count <= 0) return "#9E9E9E";
  if (count <= 1) return "#4CAF50";
  if (count <= 3) return "#FF9800";
  return "#FF5722";
};

const getBadgeTextColor = (): string => {
  return "#FFFFFF";
};

const getIncidentCount = (matches: CargoEntry[]): number => {
  return matches.filter((m) => m._type === "Incident").length;
};

const getSiteName = (hostname: string): string => {
  const parts = hostname.replace(/^www\./, "").split(".");
  if (parts.length >= 2) {
    return parts[0];
  }
  return hostname;
};

const updateBadge = async (
  tabId: number,
  matches: CargoEntry[],
  hostname: string,
): Promise<void> => {
  const displayMode = await readDisplayMode();
  currentDisplayMode = displayMode;

  const incidentCount = getIncidentCount(matches);
  const siteName = getSiteName(hostname);

  if (displayMode === "badge-only" || displayMode === "compact-badge") {
    const badgeText =
      incidentCount <= 0
        ? ""
        : incidentCount > 3
          ? "3+"
          : String(incidentCount);

    browser.action.setBadgeText({
      tabId,
      text: badgeText,
    });
    browser.action.setBadgeBackgroundColor({
      tabId,
      color: getBadgeColor(incidentCount),
    });
    browser.action.setBadgeTextColor({
      tabId,
      color: getBadgeTextColor(),
    });

    if (displayMode === "compact-badge") {
      const tooltipText =
        incidentCount <= 0
          ? `${siteName}: No incidents`
          : `${siteName}: ${incidentCount} incident${incidentCount === 1 ? "" : "s"}`;
      browser.action.setTitle({
        tabId,
        title: tooltipText,
      });
    } else {
      browser.action.setTitle({
        tabId,
        title: `Consumer Rights Wiki\n${siteName}: ${incidentCount} incident${incidentCount === 1 ? "" : "s"}`,
      });
    }
  } else {
    browser.action.setBadgeText({
      tabId,
      text: "",
    });
    browser.action.setTitle({
      tabId,
      title: `Consumer Rights Wiki\n${siteName}: ${incidentCount} incident${incidentCount === 1 ? "" : "s"}`,
    });
  }
};

const sendMatchUpdateToTab = async (
  tabId: number,
  matches: CargoEntry[],
  type:
    | MessageType.MATCH_RESULTS_UPDATED
    | MessageType.FORCE_SHOW_INLINE_POPUP
    | MessageType.TOGGLE_INLINE_POPUP = MessageType.MATCH_RESULTS_UPDATED,
  attempt = 0,
): Promise<void> => {
  if (currentDisplayMode === "badge-only") {
    return;
  }

  try {
    await browser.tabs.sendMessage(
      tabId,
      Messaging.createMessage(type, "background", matches),
    );
  } catch {
    if (attempt >= 2) return;
    const delayMs = 250 * (attempt + 1);
    setTimeout(() => {
      void sendMatchUpdateToTab(tabId, matches, type, attempt + 1);
    }, delayMs);
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
    datasetCache = [];
    nextDatasetRefreshCheckAt = 0;
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

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes[Constants.STORAGE.DATA_REFRESH_INTERVAL_MS]) {
    nextDatasetRefreshCheckAt = 0;
  }

  if (changes[Constants.STORAGE.DISPLAY_MODE]) {
    currentDisplayMode = changes[Constants.STORAGE.DISPLAY_MODE]
      .newValue as DisplayMode;
  }
});

browser.tabs.onActivated.addListener(async ({ tabId, tab }) => {
  console.log(
    `${Constants.LOG_PREFIX} Active tab has been changed. TabId:${tabId}`,
  );

  const results = await readTabMatches(tabId);
  const hostname = tab?.url ? new URL(tab.url).hostname : "";
  await updateBadge(tabId, results, hostname);
});

browser.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  if (!tabId) return;

  const matches = await readTabMatches(tabId);

  void sendMatchUpdateToTab(tabId, matches, MessageType.TOGGLE_INLINE_POPUP);
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
    const hostname = sender.tab?.url ? new URL(sender.tab.url).hostname : "";
    const dataset = await loadDatasetCache();
    const storageKey = Constants.STORAGE.MATCHES(tabId);

    const matches = Matching.matchByPageContext(dataset, payload);

    await browser.storage.local.set({
      [storageKey]: matches,
    });

    await updateBadge(tabId, matches, hostname);
    void sendMatchUpdateToTab(tabId, matches);
  },
});

void loadDatasetCache();

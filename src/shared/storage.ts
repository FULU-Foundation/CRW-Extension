import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";
import { canonicalizeSiteScopeList } from "@/shared/siteScope";
import { ensureDataMigration } from "@/shared/dataMigrations";
import { type CargoEntry, decodeCargoEntries } from "@/shared/types";
import {
  type SnoozedSiteMap,
  normalizeSnoozedSiteMap,
} from "@/shared/snoozedSites";

const readLocalValue = async (key: string): Promise<unknown> => {
  const stored = await browser.storage.local.get(key);
  return stored[key];
};

const writeLocalValue = async (key: string, value: unknown): Promise<void> => {
  await browser.storage.local.set({ [key]: value });
};

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  return typeof value === "boolean" ? value : fallback;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
};

type RefreshIntervalOption =
  (typeof Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS)[number];

const isRefreshIntervalOption = (
  value: number,
): value is RefreshIntervalOption => {
  return Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS.includes(
    value as RefreshIntervalOption,
  );
};

type DatasetCacheRefreshInfo = {
  fetchedAt: number | null;
  lastCheckedAt: number | null;
};

const decodeDatasetCacheRefreshInfo = (
  value: unknown,
): DatasetCacheRefreshInfo => {
  if (typeof value !== "object" || value === null) {
    return { fetchedAt: null, lastCheckedAt: null };
  }

  const record = value as Record<string, unknown>;
  const fetchedAt =
    typeof record.fetchedAt === "number" ? record.fetchedAt : null;
  const lastCheckedAt =
    typeof record.lastCheckedAt === "number" ? record.lastCheckedAt : null;

  return { fetchedAt, lastCheckedAt };
};

export const readWarningsEnabled = async (): Promise<boolean> => {
  const value = await readLocalValue(Constants.STORAGE.WARNINGS_ENABLED);
  return asBoolean(value, true);
};

export const writeWarningsEnabled = async (enabled: boolean): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.WARNINGS_ENABLED, enabled);
};

export const readHideWhenNoIncidents = async (): Promise<boolean> => {
  const value = await readLocalValue(Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS);
  return asBoolean(value, true);
};

export const writeHideWhenNoIncidents = async (
  enabled: boolean,
): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS, enabled);
};

export const readSuppressedDomains = async (): Promise<string[]> => {
  await ensureDataMigration(1);
  const value = await readLocalValue(Constants.STORAGE.SUPPRESSED_DOMAINS);
  return asStringArray(value);
};

export const writeSuppressedDomains = async (
  domains: string[],
): Promise<void> => {
  await writeLocalValue(
    Constants.STORAGE.SUPPRESSED_DOMAINS,
    canonicalizeSiteScopeList(domains),
  );
};

export const readSnoozedSiteMap = async (): Promise<SnoozedSiteMap> => {
  const value = await readLocalValue(
    Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE,
  );
  return normalizeSnoozedSiteMap(value);
};

export const writeSnoozedSiteMap = async (
  value: SnoozedSiteMap,
): Promise<void> => {
  await writeLocalValue(
    Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE,
    value,
  );
};

export const readRefreshIntervalMs = async (): Promise<number> => {
  const value = await readLocalValue(
    Constants.STORAGE.DATA_REFRESH_INTERVAL_MS,
  );
  if (typeof value === "number" && isRefreshIntervalOption(value)) {
    return value;
  }
  return Constants.DEFAULT_DATA_REFRESH_INTERVAL_MS;
};

export const readDatasetCacheRefreshInfo =
  async (): Promise<DatasetCacheRefreshInfo> => {
    const value = await readLocalValue(Constants.STORAGE.DATASET_CACHE);
    return decodeDatasetCacheRefreshInfo(value);
  };

export const readLastRefreshedAt = async (): Promise<number | null> => {
  const cache = await readDatasetCacheRefreshInfo();
  return cache.fetchedAt;
};

export const readRefreshErrorMessage = async (): Promise<string | null> => {
  const value = await readLocalValue(Constants.STORAGE.DATA_REFRESH_ERROR);
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  return typeof record.message === "string" ? record.message : null;
};

const isPopupPosition = (value: unknown): value is PopupPosition => {
  return (
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right"
  );
};

export const readPopupPosition = async (): Promise<PopupPosition> => {
  const value = await readLocalValue(Constants.STORAGE.POPUP_POSITION);
  return isPopupPosition(value) ? value : Constants.DEFAULT_POPUP_POSITION;
};

export const writePopupPosition = async (
  position: PopupPosition,
): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.POPUP_POSITION, position);
};

const isAutoDismissTimeoutMs = (value: unknown): value is number => {
  return (
    typeof value === "number" &&
    (Constants.AUTO_DISMISS_TIMEOUT_OPTIONS_MS as readonly number[]).includes(
      value,
    )
  );
};

const isAutoDismissCursorOutBehavior = (
  value: unknown,
): value is AutoDismissCursorOutBehavior => {
  return value === "continue" || value === "reset" || value === "remove";
};

export const readAutoDismissEnabled = async (): Promise<boolean> => {
  const value = await readLocalValue(Constants.STORAGE.AUTO_DISMISS_ENABLED);
  return asBoolean(value, Constants.DEFAULT_AUTO_DISMISS_ENABLED);
};

export const writeAutoDismissEnabled = async (
  enabled: boolean,
): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.AUTO_DISMISS_ENABLED, enabled);
};

export const readAutoDismissTimeoutMs = async (): Promise<number> => {
  const value = await readLocalValue(Constants.STORAGE.AUTO_DISMISS_TIMEOUT_MS);
  return isAutoDismissTimeoutMs(value)
    ? value
    : Constants.DEFAULT_AUTO_DISMISS_TIMEOUT_MS;
};

export const writeAutoDismissTimeoutMs = async (ms: number): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.AUTO_DISMISS_TIMEOUT_MS, ms);
};

export const readAutoDismissShowProgressBar = async (): Promise<boolean> => {
  const value = await readLocalValue(
    Constants.STORAGE.AUTO_DISMISS_SHOW_PROGRESS_BAR,
  );
  return asBoolean(value, Constants.DEFAULT_AUTO_DISMISS_SHOW_PROGRESS_BAR);
};

export const writeAutoDismissShowProgressBar = async (
  show: boolean,
): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.AUTO_DISMISS_SHOW_PROGRESS_BAR, show);
};

export const readAutoDismissCursorOutBehavior =
  async (): Promise<AutoDismissCursorOutBehavior> => {
    const value = await readLocalValue(
      Constants.STORAGE.AUTO_DISMISS_CURSOR_OUT_BEHAVIOR,
    );
    return isAutoDismissCursorOutBehavior(value)
      ? value
      : Constants.DEFAULT_AUTO_DISMISS_CURSOR_OUT_BEHAVIOR;
  };

export const writeAutoDismissCursorOutBehavior = async (
  behavior: AutoDismissCursorOutBehavior,
): Promise<void> => {
  await writeLocalValue(
    Constants.STORAGE.AUTO_DISMISS_CURSOR_OUT_BEHAVIOR,
    behavior,
  );
};

export const readTabMatches = async (tabId: number): Promise<CargoEntry[]> => {
  const key = Constants.STORAGE.MATCHES(tabId);
  const value = await readLocalValue(key);
  return decodeCargoEntries(value);
};

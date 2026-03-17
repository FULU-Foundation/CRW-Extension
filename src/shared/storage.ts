import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { type CargoEntry, decodeCargoEntries } from "@/shared/types";
import { type SnoozedSiteMap, normalizeSnoozedSiteMap } from "@/shared/snoozedSites";

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
  const fetchedAt = typeof record.fetchedAt === "number" ? record.fetchedAt : null;
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
  const value = await readLocalValue(Constants.STORAGE.SUPPRESSED_DOMAINS);
  return asStringArray(value);
};

export const writeSuppressedDomains = async (
  domains: string[],
): Promise<void> => {
  await writeLocalValue(Constants.STORAGE.SUPPRESSED_DOMAINS, domains);
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
  await writeLocalValue(Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE, value);
};

export const readRefreshIntervalMs = async (): Promise<number> => {
  const value = await readLocalValue(Constants.STORAGE.DATA_REFRESH_INTERVAL_MS);
  if (typeof value === "number" && isRefreshIntervalOption(value)) {
    return value;
  }
  return Constants.DEFAULT_DATA_REFRESH_INTERVAL_MS;
};

export const readDatasetCacheRefreshInfo = async (): Promise<DatasetCacheRefreshInfo> => {
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

export const readTabMatches = async (tabId: number): Promise<CargoEntry[]> => {
  const key = Constants.STORAGE.MATCHES(tabId);
  const value = await readLocalValue(key);
  return decodeCargoEntries(value);
};


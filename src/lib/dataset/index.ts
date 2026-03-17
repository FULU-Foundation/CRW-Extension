import browser from "webextension-polyfill";
import {
  type CargoEntry,
  type LoadResult,
  type RawCargoDataset,
  decodeCargoEntry,
} from "@/shared/types";
import * as Constants from "@/shared/constants";
import { decodeEntityStrings } from "@/shared/html";
import { readRefreshIntervalMs } from "@/shared/storage";

type DatasetCacheRecord = {
  version: number;
  raw: unknown;
  etag?: string;
  fetchedAt: number;
  lastCheckedAt: number;
};

type DatasetRefreshErrorRecord = {
  message: string;
  failedAt: number;
};

const DATASET_CACHE_VERSION = 1;
const REMOTE_FETCH_MAX_ATTEMPTS = 3;
const REMOTE_FETCH_BASE_DELAY_MS = 500;

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const load = async (): Promise<LoadResult> => {
  console.log(`${Constants.LOG_PREFIX} Loading dataset...`);

  const cached = await readCache();
  const now = Date.now();
  const refreshIntervalMs = await readConfiguredRefreshIntervalMs();
  const isFresh = cached && now - cached.lastCheckedAt < refreshIntervalMs;

  if (isFresh) {
    return buildLoadResult(cached.raw, "cache");
  }

  try {
    const refreshed = await refreshCacheWithRetry(cached, now);
    return buildLoadResult(refreshed.raw, cached ? "remote+cache" : "remote");
  } catch (error) {
    await writeRefreshError(error);
    if (cached) {
      console.warn(
        `${Constants.LOG_PREFIX} Remote dataset refresh failed, using stale cache`,
        error,
      );
      return buildLoadResult(cached.raw, "stale-cache");
    }

    console.error(
      `${Constants.LOG_PREFIX} Remote dataset unavailable and no cache found, using empty dataset fallback`,
      error,
    );
    return buildLoadResult(createEmptyRawDataset(), "empty-fallback");
  }
};

export const refreshNow = async (): Promise<LoadResult> => {
  console.log(`${Constants.LOG_PREFIX} Forcing dataset refresh...`);

  try {
    const cached = await readCache();
    const refreshed = await refreshCacheWithRetry(cached, Date.now(), {
      forceNetworkFetch: true,
    });
    return buildLoadResult(refreshed.raw, cached ? "remote+cache" : "remote");
  } catch (error) {
    await writeRefreshError(error);
    throw error;
  }
};

const normalizeDataset = (value: unknown): RawCargoDataset => {
  const json = isObjectRecord(value) ? value : {};
  const normalized = createEmptyRawDataset();

  for (const key of Constants.DATASET_KEYS) {
    const section = json[key];
    if (!Array.isArray(section)) {
      console.warn(
        `${Constants.LOG_PREFIX} Missing or invalid dataset section: ${key}`,
      );
      continue;
    }
    normalized[key] = section;
  }

  return normalized;
};

const flattenDataset = (json: RawCargoDataset): CargoEntry[] => {
  const flattened: CargoEntry[] = [];

  for (const key of Constants.DATASET_KEYS) {
    const section = json[key];

    for (const item of section) {
      const decodedItem = decodeEntityStrings(item);
      const typedItem = decodeCargoEntry({
        ...(isObjectRecord(decodedItem) ? decodedItem : {}),
        _type: key,
      });
      if (!typedItem) continue;
      flattened.push(typedItem);
    }
  }

  return flattened;
};

const buildLoadResult = (raw: unknown, source: string): LoadResult => {
  const normalizedRaw = normalizeDataset(raw);
  const typedData = flattenDataset(normalizedRaw);

  console.log(
    `${Constants.LOG_PREFIX} Dataset loaded from ${source} with ${typedData.length} entries`,
  );

  return { raw: normalizedRaw, all: typedData };
};

const readCache = async (): Promise<DatasetCacheRecord | null> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATASET_CACHE,
  );
  const value = stored[Constants.STORAGE.DATASET_CACHE];

  if (!isValidCacheRecord(value)) return null;
  return value;
};

export const readConfiguredRefreshIntervalMs = readRefreshIntervalMs;

const writeRefreshError = async (error: unknown): Promise<void> => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unknown dataset fetch error";

  const record: DatasetRefreshErrorRecord = {
    message,
    failedAt: Date.now(),
  };

  await browser.storage.local.set({
    [Constants.STORAGE.DATA_REFRESH_ERROR]: record,
  });
};

const clearRefreshError = async (): Promise<void> => {
  await browser.storage.local.remove(Constants.STORAGE.DATA_REFRESH_ERROR);
};

const isValidCacheRecord = (value: unknown): value is DatasetCacheRecord => {
  if (!isObjectRecord(value)) return false;
  if (value.version !== DATASET_CACHE_VERSION) return false;
  if (typeof value.fetchedAt !== "number") return false;
  if (typeof value.lastCheckedAt !== "number") return false;
  return isObjectRecord(value.raw);
};

const refreshCache = async (
  cached: DatasetCacheRecord | null,
  now: number,
  options?: {
    forceNetworkFetch?: boolean;
  },
): Promise<DatasetCacheRecord> => {
  const headers = new Headers();
  if (!options?.forceNetworkFetch && cached?.etag) {
    headers.set("If-None-Match", cached.etag);
  }

  const response = await fetch(Constants.DATA_REMOTE_URL, {
    headers,
    cache: "no-store",
  });

  if (response.status === 304 && cached) {
    const updated = {
      ...cached,
      lastCheckedAt: now,
    };
    await writeCache(updated);
    await clearRefreshError();
    return updated;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset (${response.status})`);
  }

  const json = await response.json();
  const normalizedRaw = normalizeDataset(json);

  const record: DatasetCacheRecord = {
    version: DATASET_CACHE_VERSION,
    raw: normalizedRaw,
    etag: response.headers.get("etag") || undefined,
    fetchedAt: now,
    lastCheckedAt: now,
  };

  await writeCache(record);
  await clearRefreshError();
  return record;
};

const writeCache = async (record: DatasetCacheRecord): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.DATASET_CACHE]: record,
  });
};

const refreshCacheWithRetry = async (
  cached: DatasetCacheRecord | null,
  now: number,
  options?: {
    forceNetworkFetch?: boolean;
  },
): Promise<DatasetCacheRecord> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= REMOTE_FETCH_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await refreshCache(cached, now, options);
    } catch (error) {
      lastError = error;

      if (attempt >= REMOTE_FETCH_MAX_ATTEMPTS) break;

      const delayMs = REMOTE_FETCH_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `${Constants.LOG_PREFIX} Dataset fetch attempt ${attempt} failed, retrying in ${delayMs}ms`,
        error,
      );
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Dataset fetch failed");
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const createEmptyRawDataset = (): RawCargoDataset => {
  return {
    Company: [],
    Incident: [],
    Product: [],
    ProductLine: [],
  };
};

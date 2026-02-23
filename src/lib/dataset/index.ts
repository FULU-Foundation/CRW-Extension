import browser from "webextension-polyfill";
import { CargoEntry, LoadResult } from "@/shared/types";
import * as Constants from "@/shared/constants";
import { decodeEntityStrings } from "@/shared/html";

type DatasetCacheRecord = {
  version: number;
  raw: any;
  etag?: string;
  fetchedAt: number;
  lastCheckedAt: number;
};

const DATASET_CACHE_VERSION = 1;
const REMOTE_FETCH_MAX_ATTEMPTS = 3;
const REMOTE_FETCH_BASE_DELAY_MS = 500;

export const load = async (): Promise<LoadResult> => {
  console.log(`${Constants.LOG_PREFIX} Loading dataset...`);

  const cached = await readCache();
  const now = Date.now();
  const isFresh =
    cached && now - cached.lastCheckedAt < Constants.DATA_CACHE_TTL_MS;

  if (isFresh) {
    return buildLoadResult(cached.raw, "cache");
  }

  try {
    const refreshed = await refreshCacheWithRetry(cached, now);
    return buildLoadResult(refreshed.raw, cached ? "remote+cache" : "remote");
  } catch (error) {
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

const validateDataset = (json: any) => {
  for (const key of Constants.DATASET_KEYS) {
    if (!Array.isArray(json[key])) {
      console.warn(
        `${Constants.LOG_PREFIX} Missing or invalid dataset section: ${key}`,
      );
      json[key] = [];
    }
  }
};

const flattenDataset = (json: any): CargoEntry[] => {
  const flattened: CargoEntry[] = [];

  for (const key of Constants.DATASET_KEYS) {
    const section = json[key] || [];

    for (const item of section) {
      const decodedItem = decodeEntityStrings(item) as Record<string, unknown>;
      flattened.push({
        ...decodedItem,
        _type: key,
      } as CargoEntry);
    }
  }

  return flattened;
};

const buildLoadResult = (raw: any, source: string): LoadResult => {
  validateDataset(raw);
  const typedData = flattenDataset(raw);

  console.log(
    `${Constants.LOG_PREFIX} Dataset loaded from ${source} with ${typedData.length} entries`,
  );

  return { raw, all: typedData };
};

const readCache = async (): Promise<DatasetCacheRecord | null> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATASET_CACHE,
  );
  const value = stored[Constants.STORAGE.DATASET_CACHE];

  if (!isValidCacheRecord(value)) return null;
  return value;
};

const isValidCacheRecord = (value: any): value is DatasetCacheRecord => {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.version === DATASET_CACHE_VERSION &&
    typeof value.fetchedAt === "number" &&
    typeof value.lastCheckedAt === "number" &&
    value.raw &&
    typeof value.raw === "object",
  );
};

const refreshCache = async (
  cached: DatasetCacheRecord | null,
  now: number,
): Promise<DatasetCacheRecord> => {
  const headers = new Headers();
  if (cached?.etag) headers.set("If-None-Match", cached.etag);

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
    return updated;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset (${response.status})`);
  }

  const json = await response.json();
  validateDataset(json);

  const record: DatasetCacheRecord = {
    version: DATASET_CACHE_VERSION,
    raw: json,
    etag: response.headers.get("etag") || undefined,
    fetchedAt: now,
    lastCheckedAt: now,
  };

  await writeCache(record);
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
): Promise<DatasetCacheRecord> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= REMOTE_FETCH_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await refreshCache(cached, now);
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

const createEmptyRawDataset = (): Record<string, unknown> => {
  return {
    Company: [],
    Incident: [],
    Product: [],
    ProductLine: [],
  };
};

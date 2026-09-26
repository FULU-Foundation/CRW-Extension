import type browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import type { CargoEntry, CargoEntryType } from "@/shared/types";

type StorageArea = Pick<browser.Storage.StorageArea, "get" | "set" | "remove">;

const LEGACY_DATASET_CACHE_KEYS = new Set(["crw_raw", "crw_all"]);

export type TabMatchReference = {
  type: CargoEntryType;
  pageId: string;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isCargoEntryType = (value: unknown): value is CargoEntryType => {
  return (
    typeof value === "string" &&
    Constants.DATASET_KEYS.includes(value as CargoEntryType)
  );
};

const decodeTabMatchReferences = (value: unknown): TabMatchReference[] => {
  if (!Array.isArray(value)) return [];

  const references: TabMatchReference[] = [];
  for (const item of value) {
    if (!isObjectRecord(item)) continue;
    if (!isCargoEntryType(item.type) || typeof item.pageId !== "string") {
      continue;
    }
    references.push({ type: item.type, pageId: item.pageId });
  }
  return references;
};

const referenceKey = (reference: TabMatchReference): string => {
  return `${reference.type}:${reference.pageId}`;
};

const findKeys = async (
  storageArea: Pick<StorageArea, "get">,
  predicate: (key: string) => boolean,
): Promise<string[]> => {
  const stored = await storageArea.get(null);
  return Object.keys(stored).filter(predicate);
};

export const readTabMatchReferences = async (
  storageArea: Pick<StorageArea, "get">,
  tabId: number,
): Promise<TabMatchReference[]> => {
  const key = Constants.STORAGE.MATCHES(tabId);
  const stored = await storageArea.get(key);
  return decodeTabMatchReferences(stored[key]);
};

export const writeTabMatchReferences = async (
  storageArea: Pick<StorageArea, "set" | "remove">,
  tabId: number,
  matches: CargoEntry[],
): Promise<void> => {
  const key = Constants.STORAGE.MATCHES(tabId);

  // Most pages do not match anything. Do not spend cache space on empty
  // arrays, even though the session cache is cleared when the browser exits.
  if (matches.length === 0) {
    await storageArea.remove(key);
    return;
  }

  const references = matches.map((match) => ({
    type: match._type,
    pageId: match.PageID,
  }));
  await storageArea.set({ [key]: references });
};

export const resolveTabMatchReferences = (
  references: TabMatchReference[],
  dataset: CargoEntry[],
): CargoEntry[] => {
  const entriesByReference = new Map(
    dataset.map((entry) => [
      referenceKey({ type: entry._type, pageId: entry.PageID }),
      entry,
    ]),
  );

  return references.flatMap((reference) => {
    const entry = entriesByReference.get(referenceKey(reference));
    return entry ? [entry] : [];
  });
};

export const removeTabMatches = async (
  storageArea: Pick<StorageArea, "remove">,
  tabId: number,
): Promise<void> => {
  await storageArea.remove(Constants.STORAGE.MATCHES(tabId));
};

export const clearTabMatches = async (
  storageArea: Pick<StorageArea, "get" | "remove">,
): Promise<void> => {
  const keys = await findKeys(storageArea, (key) =>
    key.startsWith(Constants.STORAGE.MATCHES_PREFIX),
  );
  if (keys.length > 0) await storageArea.remove(keys);
};

export const clearObsoleteLocalCaches = async (
  storageArea: Pick<StorageArea, "get" | "remove">,
): Promise<void> => {
  const keys = await findKeys(storageArea, (key) => {
    return (
      key.startsWith(Constants.STORAGE.MATCHES_PREFIX) ||
      LEGACY_DATASET_CACHE_KEYS.has(key)
    );
  });
  if (keys.length > 0) await storageArea.remove(keys);
};

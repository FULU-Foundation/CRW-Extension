import type browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { type CargoEntry, decodeCargoEntries } from "@/shared/types";

type StorageArea = Pick<
  browser.Storage.StorageArea,
  "get" | "set" | "remove"
>;

const LEGACY_DATASET_CACHE_KEYS = new Set(["crw_raw", "crw_all"]);

const findKeys = async (
  storageArea: Pick<StorageArea, "get">,
  predicate: (key: string) => boolean,
): Promise<string[]> => {
  const stored = await storageArea.get(null);
  return Object.keys(stored).filter(predicate);
};

export const readTabMatches = async (
  storageArea: Pick<StorageArea, "get">,
  tabId: number,
): Promise<CargoEntry[]> => {
  const key = Constants.STORAGE.MATCHES(tabId);
  const stored = await storageArea.get(key);
  return decodeCargoEntries(stored[key]);
};

export const writeTabMatches = async (
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

  await storageArea.set({ [key]: matches });
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

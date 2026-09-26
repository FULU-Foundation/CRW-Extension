import type browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";

type StorageArea = Pick<browser.Storage.StorageArea, "get" | "remove">;

const LEGACY_DATASET_CACHE_KEYS = new Set(["crw_raw", "crw_all"]);

export const clearObsoleteLocalCaches = async (
  storageArea: StorageArea,
): Promise<void> => {
  const stored = await storageArea.get(null);
  const obsoleteKeys = Object.keys(stored).filter((key) => {
    return (
      key.startsWith(Constants.STORAGE.MATCHES_PREFIX) ||
      LEGACY_DATASET_CACHE_KEYS.has(key)
    );
  });

  if (obsoleteKeys.length > 0) await storageArea.remove(obsoleteKeys);
};

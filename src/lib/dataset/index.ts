import browser from "webextension-polyfill";
import { CargoEntry, LoadResult } from "@/shared/types";
import * as Constants from "@/shared/constants";

export async function load(): Promise<LoadResult> {
  console.log(`${Constants.LOG_PREFIX} Loading dataset...`);

  const url = browser.runtime.getURL(Constants.DATA_FILE_PATH);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch dataset");

  const json = await response.json();
  validateDataset(json);

  const typedData = flattenDataset(json);

  await browser.storage.local.set({
    [Constants.STORAGE.RAW]: json,
    [Constants.STORAGE.ALL]: typedData
  });

  console.log(`${Constants.LOG_PREFIX} Dataset loaded with ${typedData.length} entries`);

  return { raw: json, all: typedData };
}

function validateDataset(json: any) {
  for (const key of Constants.DATASET_KEYS) {
    if (!Array.isArray(json[key])) {
      console.warn(
        `${Constants.LOG_PREFIX} Missing or invalid dataset section: ${key}`
      );
      json[key] = [];
    }
  }
}

function flattenDataset(json: any): CargoEntry[] {
  const flattened: CargoEntry[] = [];

  for (const key of Constants.DATASET_KEYS) {
    const section = json[key] || [];

    for (const item of section) {
      flattened.push({
        ...item,
        _type: key
      });
    }
  }

  return flattened;
}

import browser from "webextension-polyfill";
import { CargoEntry, LoadResult } from "@/shared/types";
import * as Constants from "@/shared/constants";
import { decodeEntityStrings } from "@/shared/html";

export const load = async (): Promise<LoadResult> => {
  console.log(`${Constants.LOG_PREFIX} Loading dataset...`);

  const url = browser.runtime.getURL(Constants.DATA_FILE_PATH);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch dataset");

  const json = await response.json();
  validateDataset(json);

  const typedData = flattenDataset(json);

  console.log(
    `${Constants.LOG_PREFIX} Dataset loaded with ${typedData.length} entries`,
  );

  return { raw: json, all: typedData };
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

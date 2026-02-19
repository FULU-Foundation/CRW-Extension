import type { CargoEntryType } from "@/shared/types";

export const LOG_PREFIX = "[CRW_EXTENSION]";

export const DATA_FILE_PATH = "assets/all_cargo_combined.json";
export const DATASET_KEYS: CargoEntryType[] = [
  "Company",
  "Incident",
  "Product",
  "ProductLine",
];

export const STORAGE = {
  MATCHES: (tabId: number) => {
    return `crw_matched_${tabId}`;
  },
};

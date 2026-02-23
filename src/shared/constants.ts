import type { CargoEntryType } from "@/shared/types";

export const LOG_PREFIX = "[CRW_EXTENSION]";

export const DATA_REMOTE_URL =
  "https://raw.githubusercontent.com/FULU-Foundation/CRW-Extension/refs/heads/export_cargo/all_cargo_combined.json";
export const DATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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
  DATASET_CACHE: "crw_dataset_cache",
  SUPPRESSED_DOMAINS: "crw_suppressed_domains",
  SUPPRESSED_PAGE_NAMES: "crw_suppressed_page_names",
  WARNINGS_ENABLED: "crw_warnings_enabled",
};

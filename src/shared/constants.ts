import type { CargoEntryType } from "@/shared/types";

export const LOG_PREFIX = "[CRW_EXTENSION]";

export const DATA_REMOTE_URL =
  "https://raw.githubusercontent.com/FULU-Foundation/CRW-Extension/refs/heads/export_cargo/all_cargo_combined.json";
export const DEFAULT_DATA_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const DATA_REFRESH_INTERVAL_OPTIONS_MS = [
  60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
] as const;
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
  DATA_REFRESH_INTERVAL_MS: "crw_data_refresh_interval_ms",
  DATA_REFRESH_ERROR: "crw_data_refresh_error",
  DATA_MIGRATION_STATE: "crw_data_migration_state",
  SUPPRESSED_DOMAINS: "crw_suppressed_domains",
  SNOOZED_SITES_UNTIL_INCIDENT_CHANGE:
    "crw_snoozed_sites_until_incident_change",
  HIDE_WHEN_NO_INCIDENTS: "crw_hide_when_no_incidents",
  WARNINGS_ENABLED: "crw_warnings_enabled",
} as const;

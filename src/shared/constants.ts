import type { CargoEntryType } from "@/shared/types";

export const LOG_PREFIX = "[CRW_EXTENSION]";

export type PopupPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export const DEFAULT_POPUP_POSITION: PopupPosition = "top-right";

export type AutoDismissCursorOutBehavior = "continue" | "reset" | "remove";

export type AutoDismissConfig = {
  enabled: boolean;
  timeoutMs: number;
  showProgressBar: boolean;
  cursorOutBehavior: AutoDismissCursorOutBehavior;
};

export const DEFAULT_AUTO_DISMISS_ENABLED = true;
export const DEFAULT_AUTO_DISMISS_TIMEOUT_MS = 5000;
export const DEFAULT_AUTO_DISMISS_SHOW_PROGRESS_BAR = true;
export const DEFAULT_AUTO_DISMISS_CURSOR_OUT_BEHAVIOR: AutoDismissCursorOutBehavior =
  "continue";
export const AUTO_DISMISS_TIMEOUT_OPTIONS_MS = [
  3000, 5000, 10000, 15000, 30000,
] as const;

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
  POPUP_POSITION: "crw_popup_position",
  AUTO_DISMISS_ENABLED: "crw_auto_dismiss_enabled",
  AUTO_DISMISS_TIMEOUT_MS: "crw_auto_dismiss_timeout_ms",
  AUTO_DISMISS_SHOW_PROGRESS_BAR: "crw_auto_dismiss_show_progress_bar",
  AUTO_DISMISS_CURSOR_OUT_BEHAVIOR: "crw_auto_dismiss_cursor_out_behavior",
} as const;

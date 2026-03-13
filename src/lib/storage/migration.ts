import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import type { SuppressedDomain, SuppressedPageName } from "@/shared/types";

/**
 * Migrates old string-based suppression entries to new format with timestamps.
 * This runs once when the extension updates to the new version.
 */
export const migrateSuppressedEntries = async (): Promise<void> => {
  try {
    const storage = await browser.storage.local.get([
      Constants.STORAGE.SUPPRESSED_DOMAINS,
      Constants.STORAGE.SUPPRESSED_PAGE_NAMES,
      Constants.STORAGE.SUPPRESSED_DOMAINS_V2,
      Constants.STORAGE.SUPPRESSED_PAGE_NAMES_V2,
    ]);

    // Check if migration is already done (v2 keys exist)
    const hasMigratedDomains = Array.isArray(
      storage[Constants.STORAGE.SUPPRESSED_DOMAINS_V2],
    );
    const hasMigratedPageNames = Array.isArray(
      storage[Constants.STORAGE.SUPPRESSED_PAGE_NAMES_V2],
    );

    if (hasMigratedDomains && hasMigratedPageNames) {
      // Migration already complete
      return;
    }

    const now = Date.now();

    // Migrate domains
    if (!hasMigratedDomains) {
      const oldDomains = storage[Constants.STORAGE.SUPPRESSED_DOMAINS];
      if (Array.isArray(oldDomains)) {
        const migratedDomains: SuppressedDomain[] = oldDomains
          .filter((entry): entry is string => typeof entry === "string")
          .map((name) => ({
            name: name.trim().toLowerCase().replace(/^www\./, ""),
            dismissedAt: now,
          }))
          .filter((entry) => entry.name.length > 0);

        await browser.storage.local.set({
          [Constants.STORAGE.SUPPRESSED_DOMAINS_V2]: migratedDomains,
        });
      } else {
        // Initialize empty array if no old data
        await browser.storage.local.set({
          [Constants.STORAGE.SUPPRESSED_DOMAINS_V2]: [],
        });
      }
    }

    // Migrate page names
    if (!hasMigratedPageNames) {
      const oldPageNames = storage[Constants.STORAGE.SUPPRESSED_PAGE_NAMES];
      if (Array.isArray(oldPageNames)) {
        const migratedPageNames: SuppressedPageName[] = oldPageNames
          .filter((entry): entry is string => typeof entry === "string")
          .map((name) => ({
            name: name.trim(),
            dismissedAt: now,
          }))
          .filter((entry) => entry.name.length > 0);

        await browser.storage.local.set({
          [Constants.STORAGE.SUPPRESSED_PAGE_NAMES_V2]: migratedPageNames,
        });
      } else {
        // Initialize empty array if no old data
        await browser.storage.local.set({
          [Constants.STORAGE.SUPPRESSED_PAGE_NAMES_V2]: [],
        });
      }
    }

    console.log(
      `${Constants.LOG_PREFIX} Migration completed: suppression entries migrated with timestamps`,
    );
  } catch (error) {
    console.error(
      `${Constants.LOG_PREFIX} Migration failed:`,
      error instanceof Error ? error.message : String(error),
    );
  }
};

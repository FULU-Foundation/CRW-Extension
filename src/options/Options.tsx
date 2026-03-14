import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { OptionsView } from "@/options/OptionsView";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";

const readWarningsEnabled = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.WARNINGS_ENABLED,
  );
  const value = stored[Constants.STORAGE.WARNINGS_ENABLED];
  if (typeof value === "boolean") return value;
  return true;
};

const normalizeHostname = (hostname: string): string => {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
};

const readSuppressedDomains = async (): Promise<string[]> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.SUPPRESSED_DOMAINS,
  );
  const value = stored[Constants.STORAGE.SUPPRESSED_DOMAINS];
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => normalizeHostname(entry))
    .filter((entry) => entry.length > 0);
};

const normalizePageName = (pageName: string): string => {
  return pageName.trim().toLowerCase();
};

const readSuppressedPageNames = async (): Promise<string[]> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.SUPPRESSED_PAGE_NAMES,
  );
  const value = stored[Constants.STORAGE.SUPPRESSED_PAGE_NAMES];
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const writeSuppressedDomains = async (domains: string[]): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: domains,
  });
};

const writeSuppressedPageNames = async (pageNames: string[]): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_PAGE_NAMES]: pageNames,
  });
};

const readRefreshIntervalMs = async (): Promise<number> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATA_REFRESH_INTERVAL_MS,
  );
  const value = stored[Constants.STORAGE.DATA_REFRESH_INTERVAL_MS];

  if (
    typeof value === "number" &&
    Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS.includes(
      value as (typeof Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS)[number],
    )
  ) {
    return value;
  }

  return Constants.DEFAULT_DATA_REFRESH_INTERVAL_MS;
};

const readLastRefreshedAt = async (): Promise<number | null> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATASET_CACHE,
  );
  const cache = stored[Constants.STORAGE.DATASET_CACHE] as
    | { fetchedAt?: unknown }
    | undefined;
  return typeof cache?.fetchedAt === "number" ? cache.fetchedAt : null;
};

const readLastRefreshError = async (): Promise<string | null> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATA_REFRESH_ERROR,
  );
  const value = stored[Constants.STORAGE.DATA_REFRESH_ERROR] as
    | { message?: unknown }
    | undefined;
  return typeof value?.message === "string" ? value.message : null;
};

const Options = () => {
  const [warningsEnabled, setWarningsEnabled] = useState<boolean>(true);
  const [suppressedDomains, setSuppressedDomains] = useState<string[]>([]);
  const [suppressedPageNames, setSuppressedPageNames] = useState<string[]>([]);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(
    Constants.DEFAULT_DATA_REFRESH_INTERVAL_MS,
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);
  const [refreshingNow, setRefreshingNow] = useState<boolean>(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void (async () => {
      try {
        const [
          enabled,
          domains,
          pageNames,
          intervalMs,
          refreshedAt,
          fetchError,
        ] = await Promise.all([
          readWarningsEnabled(),
          readSuppressedDomains(),
          readSuppressedPageNames(),
          readRefreshIntervalMs(),
          readLastRefreshedAt(),
          readLastRefreshError(),
        ]);
        setWarningsEnabled(enabled);
        setSuppressedDomains(domains);
        setSuppressedPageNames(pageNames);
        setRefreshIntervalMs(intervalMs);
        setLastRefreshedAt(refreshedAt);
        setLastRefreshError(fetchError);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onStorageChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") return;

      if (changes[Constants.STORAGE.DATA_REFRESH_INTERVAL_MS]) {
        const nextValue =
          changes[Constants.STORAGE.DATA_REFRESH_INTERVAL_MS].newValue;
        if (
          typeof nextValue === "number" &&
          Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS.includes(
            nextValue as (typeof Constants.DATA_REFRESH_INTERVAL_OPTIONS_MS)[number],
          )
        ) {
          setRefreshIntervalMs(nextValue);
        } else {
          setRefreshIntervalMs(Constants.DEFAULT_DATA_REFRESH_INTERVAL_MS);
        }
      }

      if (changes[Constants.STORAGE.DATASET_CACHE]) {
        const nextCache = changes[Constants.STORAGE.DATASET_CACHE].newValue as
          | { fetchedAt?: unknown }
          | undefined;
        setLastRefreshedAt(
          typeof nextCache?.fetchedAt === "number" ? nextCache.fetchedAt : null,
        );
      }

      if (changes[Constants.STORAGE.DATA_REFRESH_ERROR]) {
        const nextError = changes[Constants.STORAGE.DATA_REFRESH_ERROR]
          .newValue as { message?: unknown } | undefined;
        setLastRefreshError(
          typeof nextError?.message === "string" ? nextError.message : null,
        );
      }
    };

    browser.storage.onChanged.addListener(onStorageChanged);
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged);
    };
  }, []);

  const onToggleWarnings = async (enabled: boolean) => {
    setWarningsEnabled(enabled);
    await browser.storage.local.set({
      [Constants.STORAGE.WARNINGS_ENABLED]: enabled,
    });
  };

  const onRemoveSuppressedDomain = async (domain: string) => {
    const normalized = normalizeHostname(domain);
    const next = suppressedDomains.filter((value) => value !== normalized);
    setSuppressedDomains(next);
    await writeSuppressedDomains(next);
  };

  const onRemoveSuppressedPageName = async (pageName: string) => {
    const normalized = normalizePageName(pageName);
    const next = suppressedPageNames.filter(
      (value) => normalizePageName(value) !== normalized,
    );
    setSuppressedPageNames(next);
    await writeSuppressedPageNames(next);
  };

  const onChangeRefreshInterval = async (nextRefreshIntervalMs: number) => {
    setRefreshIntervalMs(nextRefreshIntervalMs);
    setRefreshError(null);
    await browser.storage.local.set({
      [Constants.STORAGE.DATA_REFRESH_INTERVAL_MS]: nextRefreshIntervalMs,
    });
  };

  const onRefreshNow = async () => {
    setRefreshingNow(true);
    setRefreshError(null);

    try {
      const response = (await browser.runtime.sendMessage(
        Messaging.createMessage(MessageType.REFRESH_DATASET_NOW, "options"),
      )) as { fetchedAt?: number | null } | undefined;

      if (typeof response?.fetchedAt === "number") {
        setLastRefreshedAt(response.fetchedAt);
      } else {
        setLastRefreshedAt(await readLastRefreshedAt());
      }
    } catch (error) {
      console.error(
        `${Constants.LOG_PREFIX} Manual dataset refresh failed`,
        error,
      );
      setRefreshError("Refresh failed. Please try again.");
    } finally {
      setRefreshingNow(false);
    }
  };

  const onOpenSafariSetupGuide = async () => {
    await browser.tabs.create({
      url: browser.runtime.getURL("post-install-safari.html"),
    });
  };

  return (
    <OptionsView
      warningsEnabled={warningsEnabled}
      suppressedDomains={suppressedDomains}
      suppressedPageNames={suppressedPageNames}
      refreshIntervalMs={refreshIntervalMs}
      lastRefreshedAt={lastRefreshedAt}
      refreshingNow={refreshingNow}
      refreshError={refreshError}
      lastRefreshError={lastRefreshError}
      loading={loading}
      onToggleWarnings={(enabled) => {
        void onToggleWarnings(enabled);
      }}
      onChangeRefreshInterval={(nextRefreshIntervalMs) => {
        void onChangeRefreshInterval(nextRefreshIntervalMs);
      }}
      onRefreshNow={() => {
        void onRefreshNow();
      }}
      onRemoveSuppressedDomain={(domain) => {
        void onRemoveSuppressedDomain(domain);
      }}
      onRemoveSuppressedPageName={(pageName) => {
        void onRemoveSuppressedPageName(pageName);
      }}
      onOpenSafariSetupGuide={() => {
        void onOpenSafariSetupGuide();
      }}
    />
  );
};

export default Options;

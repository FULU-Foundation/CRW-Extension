import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { OptionsView } from "@/options/OptionsView";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import {
  type SnoozedSiteMap,
  normalizeSnoozedSiteMap,
} from "@/shared/snoozedSites";

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

const readHideWhenNoIncidents = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS,
  );
  const value = stored[Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS];
  if (typeof value === "boolean") return value;
  return true;
};

const readSnoozedSiteMap = async (): Promise<SnoozedSiteMap> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE,
  );
  return normalizeSnoozedSiteMap(
    stored[
      Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE
    ] as SnoozedSiteMap | undefined,
  );
};

const writeSuppressedDomains = async (domains: string[]): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: domains,
  });
};

const writeSnoozedSiteMap = async (value: SnoozedSiteMap): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE]: value,
  });
};

const readSnoozedSites = async (): Promise<string[]> => {
  const value = await readSnoozedSiteMap();
  return Object.keys(value)
    .map((domain) => normalizeHostname(domain))
    .filter((domain) => domain.length > 0)
    .sort((left, right) => left.localeCompare(right));
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
  const [hideWhenNoIncidents, setHideWhenNoIncidents] = useState<boolean>(true);
  const [suppressedDomains, setSuppressedDomains] = useState<string[]>([]);
  const [snoozedSites, setSnoozedSites] = useState<string[]>([]);
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
          hideWithoutIncidents,
          domains,
          snoozedSiteDomains,
          intervalMs,
          refreshedAt,
          fetchError,
        ] = await Promise.all([
          readWarningsEnabled(),
          readHideWhenNoIncidents(),
          readSuppressedDomains(),
          readSnoozedSites(),
          readRefreshIntervalMs(),
          readLastRefreshedAt(),
          readLastRefreshError(),
        ]);
        setWarningsEnabled(enabled);
        setHideWhenNoIncidents(hideWithoutIncidents);
        setSuppressedDomains(domains);
        setSnoozedSites(snoozedSiteDomains);
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

      if (changes[Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS]) {
        const nextValue = changes[Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS]
          .newValue;
        setHideWhenNoIncidents(
          typeof nextValue === "boolean" ? nextValue : true,
        );
      }

      if (changes[Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE]) {
        const nextValue = normalizeSnoozedSiteMap(
          changes[Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE]
            .newValue as SnoozedSiteMap | undefined,
        );
        setSnoozedSites(
          Object.keys(nextValue)
            .map((domain) => normalizeHostname(domain))
            .filter((domain) => domain.length > 0)
            .sort((left, right) => left.localeCompare(right)),
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

  const onToggleHideWhenNoIncidents = async (enabled: boolean) => {
    setHideWhenNoIncidents(enabled);
    await browser.storage.local.set({
      [Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS]: enabled,
    });
  };

  const onRemoveSnoozedSite = async (domain: string) => {
    const normalized = normalizeHostname(domain);
    if (!normalized) return;

    const existing = await readSnoozedSiteMap();
    if (!Object.prototype.hasOwnProperty.call(existing, normalized)) return;
    const next = { ...existing };
    delete next[normalized];
    setSnoozedSites(
      Object.keys(next)
        .map((value) => normalizeHostname(value))
        .filter((value) => value.length > 0)
        .sort((left, right) => left.localeCompare(right)),
    );
    await writeSnoozedSiteMap(next);
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

  return (
    <OptionsView
      warningsEnabled={warningsEnabled}
      hideWhenNoIncidents={hideWhenNoIncidents}
      suppressedDomains={suppressedDomains}
      snoozedSites={snoozedSites}
      refreshIntervalMs={refreshIntervalMs}
      lastRefreshedAt={lastRefreshedAt}
      refreshingNow={refreshingNow}
      refreshError={refreshError}
      lastRefreshError={lastRefreshError}
      loading={loading}
      onToggleWarnings={(enabled) => {
        void onToggleWarnings(enabled);
      }}
      onToggleHideWhenNoIncidents={(enabled) => {
        void onToggleHideWhenNoIncidents(enabled);
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
      onRemoveSnoozedSite={(domain) => {
        void onRemoveSnoozedSite(domain);
      }}
    />
  );
};

export default Options;

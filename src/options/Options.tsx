import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";
import {
  DEFAULT_AUTO_DISMISS_HOVER_CANCEL_MS,
  DEFAULT_AUTO_DISMISS_CURSOR_OUT_BEHAVIOR,
  DEFAULT_AUTO_DISMISS_ENABLED,
  DEFAULT_AUTO_DISMISS_SHOW_PROGRESS_BAR,
  DEFAULT_AUTO_DISMISS_TIMEOUT_MS,
  DEFAULT_POPUP_POSITION,
} from "@/shared/constants";
import { OptionsView } from "@/options/OptionsView";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { normalizeHostname } from "@/shared/siteScope";
import {
  readAutoDismissHoverCancelMs,
  readAutoDismissCursorOutBehavior,
  readAutoDismissEnabled,
  readAutoDismissShowProgressBar,
  readAutoDismissTimeoutMs,
  readHideWhenNoIncidents,
  readLastRefreshedAt,
  readPopupPosition,
  readRefreshErrorMessage,
  readRefreshIntervalMs,
  readSnoozedSiteMap,
  readSuppressedDomains,
  readWarningsEnabled,
  writeAutoDismissHoverCancelMs,
  writeAutoDismissCursorOutBehavior,
  writeAutoDismissEnabled,
  writeAutoDismissShowProgressBar,
  writeAutoDismissTimeoutMs,
  writeHideWhenNoIncidents,
  writePopupPosition,
  writeSnoozedSiteMap,
  writeSuppressedDomains,
  writeWarningsEnabled,
} from "@/shared/storage";

const readSnoozedSites = async (): Promise<string[]> => {
  const value = await readSnoozedSiteMap();
  return Object.keys(value)
    .map((domain) => normalizeHostname(domain))
    .filter((domain) => domain.length > 0)
    .sort((left, right) => left.localeCompare(right));
};

const readLastRefreshError = readRefreshErrorMessage;

const decodeRefreshNowResponseFetchedAt = (value: unknown): number | null => {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.fetchedAt === "number" ? record.fetchedAt : null;
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
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(
    DEFAULT_POPUP_POSITION,
  );
  const [autoDismissEnabled, setAutoDismissEnabled] = useState<boolean>(
    DEFAULT_AUTO_DISMISS_ENABLED,
  );
  const [autoDismissTimeoutMs, setAutoDismissTimeoutMs] = useState<number>(
    DEFAULT_AUTO_DISMISS_TIMEOUT_MS,
  );
  const [autoDismissShowProgressBar, setAutoDismissShowProgressBar] =
    useState<boolean>(DEFAULT_AUTO_DISMISS_SHOW_PROGRESS_BAR);
  const [autoDismissCursorOutBehavior, setAutoDismissCursorOutBehavior] =
    useState<AutoDismissCursorOutBehavior>(
      DEFAULT_AUTO_DISMISS_CURSOR_OUT_BEHAVIOR,
    );
  const [autoDismissHoverCancelMs, setAutoDismissHoverCancelMs] =
    useState<number>(DEFAULT_AUTO_DISMISS_HOVER_CANCEL_MS);

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
          position,
          dismissEnabled,
          dismissTimeoutMs,
          dismissShowBar,
          dismissCursorOut,
          dismissHoverCancelMs,
        ] = await Promise.all([
          readWarningsEnabled(),
          readHideWhenNoIncidents(),
          readSuppressedDomains(),
          readSnoozedSites(),
          readRefreshIntervalMs(),
          readLastRefreshedAt(),
          readLastRefreshError(),
          readPopupPosition(),
          readAutoDismissEnabled(),
          readAutoDismissTimeoutMs(),
          readAutoDismissShowProgressBar(),
          readAutoDismissCursorOutBehavior(),
          readAutoDismissHoverCancelMs(),
        ]);
        setWarningsEnabled(enabled);
        setHideWhenNoIncidents(hideWithoutIncidents);
        setSuppressedDomains(domains);
        setSnoozedSites(snoozedSiteDomains);
        setRefreshIntervalMs(intervalMs);
        setLastRefreshedAt(refreshedAt);
        setLastRefreshError(fetchError);
        setPopupPosition(position);
        setAutoDismissEnabled(dismissEnabled);
        setAutoDismissTimeoutMs(dismissTimeoutMs);
        setAutoDismissShowProgressBar(dismissShowBar);
        setAutoDismissCursorOutBehavior(dismissCursorOut);
        setAutoDismissHoverCancelMs(dismissHoverCancelMs);
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
        void readRefreshIntervalMs().then(setRefreshIntervalMs);
      }
      if (changes[Constants.STORAGE.DATASET_CACHE]) {
        void readLastRefreshedAt().then(setLastRefreshedAt);
      }
      if (changes[Constants.STORAGE.DATA_REFRESH_ERROR]) {
        void readLastRefreshError().then(setLastRefreshError);
      }
      if (changes[Constants.STORAGE.WARNINGS_ENABLED]) {
        void readWarningsEnabled().then(setWarningsEnabled);
      }
      if (changes[Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS]) {
        void readHideWhenNoIncidents().then(setHideWhenNoIncidents);
      }
      if (changes[Constants.STORAGE.SUPPRESSED_DOMAINS]) {
        void readSuppressedDomains().then(setSuppressedDomains);
      }
      if (changes[Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE]) {
        void readSnoozedSites().then(setSnoozedSites);
      }
      if (changes[Constants.STORAGE.POPUP_POSITION]) {
        void readPopupPosition().then(setPopupPosition);
      }
      if (changes[Constants.STORAGE.AUTO_DISMISS_ENABLED]) {
        void readAutoDismissEnabled().then(setAutoDismissEnabled);
      }
      if (changes[Constants.STORAGE.AUTO_DISMISS_TIMEOUT_MS]) {
        void readAutoDismissTimeoutMs().then(setAutoDismissTimeoutMs);
      }
      if (changes[Constants.STORAGE.AUTO_DISMISS_SHOW_PROGRESS_BAR]) {
        void readAutoDismissShowProgressBar().then(
          setAutoDismissShowProgressBar,
        );
      }
      if (changes[Constants.STORAGE.AUTO_DISMISS_CURSOR_OUT_BEHAVIOR]) {
        void readAutoDismissCursorOutBehavior().then(
          setAutoDismissCursorOutBehavior,
        );
      }
      if (changes[Constants.STORAGE.AUTO_DISMISS_HOVER_CANCEL_MS]) {
        void readAutoDismissHoverCancelMs().then(setAutoDismissHoverCancelMs);
      }
    };

    browser.storage.onChanged.addListener(onStorageChanged);
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged);
    };
  }, []);

  const onToggleWarnings = async (enabled: boolean) => {
    setWarningsEnabled(enabled);
    await writeWarningsEnabled(enabled);
  };

  const onRemoveSuppressedDomain = async (domain: string) => {
    const normalized = normalizeHostname(domain);
    const next = suppressedDomains.filter((value) => value !== normalized);
    setSuppressedDomains(next);
    await writeSuppressedDomains(next);
  };

  const onToggleHideWhenNoIncidents = async (enabled: boolean) => {
    setHideWhenNoIncidents(enabled);
    await writeHideWhenNoIncidents(enabled);
  };

  const onRemoveSnoozedSite = async (domain: string) => {
    const normalized = normalizeHostname(domain);
    if (!normalized) return;

    const existing = await readSnoozedSiteMap();
    if (!existing[normalized] || existing[normalized].length === 0) return;
    const next = { ...existing };
    delete next[normalized];
    setSnoozedSites(
      Object.keys(next)
        .filter((key) => next[key] && next[key].length > 0)
        .map((value) => normalizeHostname(value))
        .filter((value) => value.length > 0)
        .sort((left, right) => left.localeCompare(right)),
    );
    await writeSnoozedSiteMap(next);
  };

  const onChangePopupPosition = async (position: PopupPosition) => {
    setPopupPosition(position);
    await writePopupPosition(position);
  };

  const onToggleAutoDismiss = async (enabled: boolean) => {
    setAutoDismissEnabled(enabled);
    await writeAutoDismissEnabled(enabled);
  };

  const onChangeAutoDismissTimeoutMs = async (ms: number) => {
    setAutoDismissTimeoutMs(ms);
    await writeAutoDismissTimeoutMs(ms);
  };

  const onToggleAutoDismissShowProgressBar = async (show: boolean) => {
    setAutoDismissShowProgressBar(show);
    await writeAutoDismissShowProgressBar(show);
  };

  const onChangeAutoDismissCursorOutBehavior = async (
    behavior: AutoDismissCursorOutBehavior,
  ) => {
    setAutoDismissCursorOutBehavior(behavior);
    await writeAutoDismissCursorOutBehavior(behavior);
  };

  const onChangeAutoDismissHoverCancelMs = async (ms: number) => {
    setAutoDismissHoverCancelMs(ms);
    await writeAutoDismissHoverCancelMs(ms);
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
      const response = await browser.runtime.sendMessage(
        Messaging.createMessage(MessageType.REFRESH_DATASET_NOW, "options"),
      );

      const fetchedAt = decodeRefreshNowResponseFetchedAt(response);
      if (fetchedAt !== null) {
        setLastRefreshedAt(fetchedAt);
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
      popupPosition={popupPosition}
      autoDismissEnabled={autoDismissEnabled}
      autoDismissTimeoutMs={autoDismissTimeoutMs}
      autoDismissShowProgressBar={autoDismissShowProgressBar}
      autoDismissCursorOutBehavior={autoDismissCursorOutBehavior}
      autoDismissHoverCancelMs={autoDismissHoverCancelMs}
      onToggleWarnings={(enabled) => void onToggleWarnings(enabled)}
      onToggleHideWhenNoIncidents={(enabled) =>
        void onToggleHideWhenNoIncidents(enabled)
      }
      onChangeRefreshInterval={(ms) => void onChangeRefreshInterval(ms)}
      onRefreshNow={() => void onRefreshNow()}
      onRemoveSuppressedDomain={(domain) =>
        void onRemoveSuppressedDomain(domain)
      }
      onRemoveSnoozedSite={(domain) => void onRemoveSnoozedSite(domain)}
      onChangePopupPosition={(position) => void onChangePopupPosition(position)}
      onToggleAutoDismiss={(enabled) => void onToggleAutoDismiss(enabled)}
      onChangeAutoDismissTimeoutMs={(ms) =>
        void onChangeAutoDismissTimeoutMs(ms)
      }
      onToggleAutoDismissShowProgressBar={(show) =>
        void onToggleAutoDismissShowProgressBar(show)
      }
      onChangeAutoDismissCursorOutBehavior={(behavior) =>
        void onChangeAutoDismissCursorOutBehavior(behavior)
      }
      onChangeAutoDismissHoverCancelMs={(ms) =>
        void onChangeAutoDismissHoverCancelMs(ms)
      }
    />
  );
};

export default Options;

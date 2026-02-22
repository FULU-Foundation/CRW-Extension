import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { OptionsView } from "@/options/OptionsView";

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

const Options = () => {
  const [warningsEnabled, setWarningsEnabled] = useState<boolean>(true);
  const [suppressedDomains, setSuppressedDomains] = useState<string[]>([]);
  const [suppressedPageNames, setSuppressedPageNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void (async () => {
      try {
        const [enabled, domains, pageNames] = await Promise.all([
          readWarningsEnabled(),
          readSuppressedDomains(),
          readSuppressedPageNames(),
        ]);
        setWarningsEnabled(enabled);
        setSuppressedDomains(domains);
        setSuppressedPageNames(pageNames);
      } finally {
        setLoading(false);
      }
    })();
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

  return (
    <OptionsView
      warningsEnabled={warningsEnabled}
      suppressedDomains={suppressedDomains}
      suppressedPageNames={suppressedPageNames}
      loading={loading}
      onToggleWarnings={(enabled) => {
        void onToggleWarnings(enabled);
      }}
      onRemoveSuppressedDomain={(domain) => {
        void onRemoveSuppressedDomain(domain);
      }}
      onRemoveSuppressedPageName={(pageName) => {
        void onRemoveSuppressedPageName(pageName);
      }}
    />
  );
};

export default Options;

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { CargoEntry, PageContext } from "@/shared/types";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { InlinePopup } from "@/content/InlinePopup";
import { InlineEmptyState } from "@/content/InlineEmptyState";
import {
  getInlinePopupInstruction,
  type InlinePopupInstruction,
} from "@/content/messageRouting";

console.log(
  `${Constants.LOG_PREFIX} Content script loaded on:`,
  window.location.href,
);

const POPUP_ID = "crw-inline-alert";
const ASSET_URLS = {
  logo: browser.runtime.getURL("crw_logo.png"),
  settings: browser.runtime.getURL("settings.svg"),
  close: browser.runtime.getURL("close.svg"),
  external: browser.runtime.getURL("open-in-new.svg"),
};

let popupHost: HTMLDivElement | null = null;
let popupRoot: Root | null = null;
let forcePopupVisible = false;

const normalizeHostname = (hostname: string): string => {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
};

const getSuppressedDomains = async (): Promise<string[]> => {
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

const isCurrentSiteSuppressed = async (): Promise<boolean> => {
  const domains = await getSuppressedDomains();
  const current = normalizeHostname(location.hostname || "");
  return current.length > 0 && domains.includes(current);
};

const normalizePageName = (pageName: string): string => {
  return pageName.trim().toLowerCase();
};

const getSuppressedPageNames = async (): Promise<string[]> => {
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

const suppressPageName = async (pageName: string): Promise<void> => {
  const trimmed = pageName.trim();
  const normalized = normalizePageName(pageName);
  if (!normalized) return;
  const names = await getSuppressedPageNames();
  if (names.some((name) => normalizePageName(name) === normalized)) return;
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_PAGE_NAMES]: [...names, trimmed],
  });
};

const isWarningsEnabled = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.WARNINGS_ENABLED,
  );
  const value = stored[Constants.STORAGE.WARNINGS_ENABLED];
  if (typeof value === "boolean") return value;
  return true;
};

const setWarningsEnabled = async (enabled: boolean): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.WARNINGS_ENABLED]: enabled,
  });
};

const openOptions = () => {
  void browser.runtime.sendMessage(
    Messaging.createMessage(MessageType.OPEN_OPTIONS_PAGE, "content"),
  );
};

const suppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  if (domains.includes(current)) return;
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: [...domains, current],
  });
};

const unsuppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  const next = domains.filter((domain) => domain !== current);
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: next,
  });
};

const ensurePopupRoot = (): Root => {
  if (popupRoot && popupHost?.isConnected) return popupRoot;

  const existing = document.getElementById(POPUP_ID);
  if (existing) existing.remove();

  popupHost = document.createElement("div");
  popupHost.id = POPUP_ID;
  document.documentElement.appendChild(popupHost);
  popupRoot = createRoot(popupHost);
  return popupRoot;
};

const removeInlinePopup = () => {
  forcePopupVisible = false;
  if (popupRoot) {
    popupRoot.unmount();
  }
  popupRoot = null;
  if (popupHost?.isConnected) {
    popupHost.remove();
  }
  popupHost = null;
};

const renderInlinePopup = async (
  matches: CargoEntry[],
  ignorePreferences = false,
) => {
  const suppressedPageNames = await getSuppressedPageNames();
  const suppressedPageNameSet = new Set(
    suppressedPageNames.map((name) => normalizePageName(name)),
  );
  const filteredMatches =
    suppressedPageNameSet.size === 0
      ? matches
      : matches.filter((match) => {
          const normalizedPageName = normalizePageName(
            String(match.PageName || ""),
          );
          if (suppressedPageNameSet.has(normalizedPageName)) return false;

          if (
            match._type === "Product" ||
            match._type === "ProductLine" ||
            match._type === "Incident"
          ) {
            const normalizedCompany = normalizePageName(
              String(match.Company || ""),
            );
            if (
              normalizedCompany &&
              suppressedPageNameSet.has(normalizedCompany)
            ) {
              return false;
            }
          }

          return true;
        });

  if (filteredMatches.length === 0 && !ignorePreferences) {
    removeInlinePopup();
    return;
  }

  const currentlyWarningsEnabled = await isWarningsEnabled();

  if (!ignorePreferences && !currentlyWarningsEnabled) {
    removeInlinePopup();
    return;
  }

  const currentlySuppressed = await isCurrentSiteSuppressed();
  if (!ignorePreferences && currentlySuppressed) {
    removeInlinePopup();
    return;
  }
  forcePopupVisible = ignorePreferences;
  const root = ensurePopupRoot();
  if (filteredMatches.length === 0) {
    root.render(
      <InlineEmptyState
        logoUrl={ASSET_URLS.logo}
        settingsIconUrl={ASSET_URLS.settings}
        onOpenSettings={openOptions}
        onClose={removeInlinePopup}
      />,
    );
    return;
  }

  const handleDisableWarnings = async () => {
    if (ignorePreferences && !currentlyWarningsEnabled) {
      await setWarningsEnabled(true);
      void renderInlinePopup(filteredMatches, true);
      return;
    }

    await setWarningsEnabled(false);
    removeInlinePopup();
  };

  const handleSuppressPageNameClick = async () => {
    const topPageName = String(filteredMatches[0]?.PageName || "");
    await suppressPageName(topPageName);
    void renderInlinePopup(matches, ignorePreferences);
  };

  const handleSuppressSiteClick = async () => {
    if (ignorePreferences && currentlySuppressed) {
      await unsuppressCurrentSite();
      void renderInlinePopup(filteredMatches, true);
      return;
    }

    await suppressCurrentSite();
    removeInlinePopup();
  };

  root.render(
    <InlinePopup
      matches={filteredMatches}
      logoUrl={ASSET_URLS.logo}
      externalIconUrl={ASSET_URLS.external}
      settingsIconUrl={ASSET_URLS.settings}
      closeIconUrl={ASSET_URLS.close}
      onClose={removeInlinePopup}
      onOpenSettings={openOptions}
      onDisableWarnings={() => void handleDisableWarnings()}
      disableWarningsLabel={
        ignorePreferences && !currentlyWarningsEnabled
          ? "Show this for all sites"
          : "Don't show me this again"
      }
      suppressButtonLabel={
        ignorePreferences && currentlySuppressed
          ? "Always show for this site"
          : "Hide for this site"
      }
      onSuppressPageName={() => void handleSuppressPageNameClick()}
      onSuppressSite={() => void handleSuppressSiteClick()}
    />,
  );
};

const runContentScript = async () => {
  if (!(await isWarningsEnabled())) {
    removeInlinePopup();
    return;
  }

  if (await isCurrentSiteSuppressed()) {
    removeInlinePopup();
    return;
  }

  const getMetaContent = (selector: string): string => {
    return (
      document.querySelector(selector)?.getAttribute("content") || ""
    ).trim();
  };

  const description = getMetaContent('meta[name="description"]');
  const metaTitle = getMetaContent('meta[name="title"]');
  const ogTitle = getMetaContent('meta[property="og:title"]');
  const ogDescription = getMetaContent('meta[property="og:description"]');

  const context: PageContext = {
    url: location.href.toLocaleLowerCase(),
    hostname: location.hostname.toLocaleLowerCase(),
    title: (document.title || "").trim(),
    meta: {
      title: metaTitle,
      description,
      "og:title": ogTitle,
      "og:description": ogDescription,
    },
  };

  browser.runtime.sendMessage(
    Messaging.createMessage(
      MessageType.PAGE_CONTEXT_UPDATE,
      "content",
      context,
    ),
  );
};

const handleInlinePopupInstruction = async (
  instruction: InlinePopupInstruction,
) => {
  if (!instruction.ignorePreferences) {
    if (forcePopupVisible && !(await isWarningsEnabled())) return;
    void renderInlinePopup(instruction.matches, false);
    return;
  }

  void renderInlinePopup(instruction.matches, true);
};

browser.runtime.onMessage.addListener((msg: unknown) => {
  const instruction = getInlinePopupInstruction(msg);
  if (!instruction) return;
  void handleInlinePopupInstruction(instruction);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  const syncPopupStateWithStorage = async () => {
    if (
      changes[Constants.STORAGE.WARNINGS_ENABLED] &&
      !(await isWarningsEnabled())
    ) {
      removeInlinePopup();
      return;
    }
    if (
      changes[Constants.STORAGE.SUPPRESSED_DOMAINS] &&
      (await isCurrentSiteSuppressed())
    ) {
      removeInlinePopup();
    }
    if (changes[Constants.STORAGE.SUPPRESSED_PAGE_NAMES]) {
      void runContentScript();
    }
  };

  void syncPopupStateWithStorage();
});

void runContentScript();

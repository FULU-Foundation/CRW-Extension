import React from "react";
import { createRoot, type Root } from "react-dom/client";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { buildIncidentSignature } from "@/shared/incidentSignature";
import { CargoEntry, PageContext } from "@/shared/types";
import {
  readHideWhenNoIncidents,
  readSnoozedSiteMap,
  readSuppressedDomains,
  readWarningsEnabled,
  writeSnoozedSiteMap,
  writeSuppressedDomains,
  writeWarningsEnabled,
} from "@/shared/storage";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { InlinePopup } from "@/content/InlinePopup";
import { InlineEmptyState } from "@/content/InlineEmptyState";
import {
  getInlinePopupInstruction,
  type InlinePopupInstruction,
} from "@/content/messageRouting";
import {
  extractAmazonMarketplaceProperties,
  extractEbayJsonLdProductProperties,
} from "@/lib/matching/ecommerce";

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
let popupShadowMount: HTMLDivElement | null = null;
let popupRoot: Root | null = null;
let forcePopupVisible = false;
const SNOOZE_UNTIL_NEW_CHANGES_LABEL = "Hide until new incidents";

const normalizeHostname = (hostname: string): string => {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
};

const getSuppressedDomains = async (): Promise<string[]> => {
  const value = await readSuppressedDomains();
  return value
    .map((entry) => normalizeHostname(entry))
    .filter((entry) => entry.length > 0);
};

const isCurrentSiteSuppressed = async (): Promise<boolean> => {
  const domains = await getSuppressedDomains();
  const current = normalizeHostname(location.hostname || "");
  return current.length > 0 && domains.includes(current);
};

const isHideWhenNoIncidentsEnabled = readHideWhenNoIncidents;

const snoozeCurrentSiteUntilNewIncidentChanges = async (
  incidentSignature: string,
): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  if (domains.includes(current)) {
    await writeSuppressedDomains(
      domains.filter((domain) => domain !== current),
    );
  }
  const snoozedSiteMap = await readSnoozedSiteMap();
  const entries = snoozedSiteMap[current] || [];
  const existingIndex = entries.findIndex(
    (entry) => entry.incidentSignature === incidentSignature,
  );
  if (existingIndex >= 0) {
    entries[existingIndex] = { incidentSignature, snoozedAt: Date.now() };
  } else {
    entries.push({ incidentSignature, snoozedAt: Date.now() });
  }
  snoozedSiteMap[current] = entries;
  await writeSnoozedSiteMap(snoozedSiteMap);
};

const unsnoozeCurrentSiteUntilNewIncidentChanges = async (
  incidentSignature?: string,
): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const snoozedSiteMap = await readSnoozedSiteMap();
  const entries = snoozedSiteMap[current];
  if (!entries || entries.length === 0) return;

  if (incidentSignature) {
    const filtered = entries.filter(
      (entry) => entry.incidentSignature !== incidentSignature,
    );
    if (filtered.length === 0) {
      delete snoozedSiteMap[current];
    } else {
      snoozedSiteMap[current] = filtered;
    }
  } else {
    delete snoozedSiteMap[current];
  }
  await writeSnoozedSiteMap(snoozedSiteMap);
};

const isCurrentSiteSnoozedUntilIncidentChanges = async (
  incidentSignature: string,
): Promise<boolean> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return false;

  const snoozedSiteMap = await readSnoozedSiteMap();
  const entries = snoozedSiteMap[current];
  if (!entries || entries.length === 0) return false;

  return entries.some((entry) => entry.incidentSignature === incidentSignature);
};

const isWarningsEnabled = readWarningsEnabled;
const setWarningsEnabled = writeWarningsEnabled;

const openOptions = () => {
  void (async () => {
    try {
      await browser.runtime.openOptionsPage();
      return;
    } catch (directOpenError) {
      try {
        await browser.runtime.sendMessage(
          Messaging.createMessage(MessageType.OPEN_OPTIONS_PAGE, "content"),
        );
        return;
      } catch (messageOpenError) {
        const error =
          messageOpenError instanceof Error
            ? messageOpenError
            : directOpenError;
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("Extension context invalidated")) {
          window.alert(
            "The extension was updated or reloaded. Please refresh this page, then try opening settings again.",
          );
          return;
        }

        console.error(
          `${Constants.LOG_PREFIX} Failed to open options page`,
          error,
        );
      }
    }
  })();
};

const suppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  if (!domains.includes(current)) {
    await writeSuppressedDomains([...domains, current]);
  }
  await unsnoozeCurrentSiteUntilNewIncidentChanges();
};

const unsuppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  const next = domains.filter((domain) => domain !== current);
  await writeSuppressedDomains(next);
};

const ensurePopupRoot = (): Root => {
  if (popupRoot && popupHost?.isConnected && popupShadowMount?.isConnected) {
    return popupRoot;
  }

  const existing = document.getElementById(POPUP_ID);
  if (existing) existing.remove();

  popupHost = document.createElement("div");
  popupHost.id = POPUP_ID;
  popupHost.style.all = "initial";
  popupHost.style.position = "static";
  popupHost.style.display = "block";

  const shadowRoot = popupHost.attachShadow({ mode: "closed" });
  const resetStyle = document.createElement("style");
  resetStyle.textContent = `
    :host {
      all: initial;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
  `;
  shadowRoot.appendChild(resetStyle);

  popupShadowMount = document.createElement("div");
  popupShadowMount.style.all = "initial";
  shadowRoot.appendChild(popupShadowMount);

  document.documentElement.appendChild(popupHost);
  popupRoot = createRoot(popupShadowMount);
  return popupRoot;
};

const removeInlinePopup = () => {
  forcePopupVisible = false;
  if (popupRoot) {
    popupRoot.unmount();
  }
  popupRoot = null;
  popupShadowMount = null;
  if (popupHost?.isConnected) {
    popupHost.remove();
  }
  popupHost = null;
};

const isInlinePopupOpen = (): boolean =>
  Boolean(popupHost?.isConnected && popupShadowMount?.isConnected && popupRoot);

const renderInlinePopup = async (
  matches: CargoEntry[],
  ignorePreferences = false,
) => {
  const visibleMatches = matches;

  const currentlyWarningsEnabled = await isWarningsEnabled();

  if (!ignorePreferences && !currentlyWarningsEnabled) {
    removeInlinePopup();
    return;
  }

  const currentlySuppressed = await isCurrentSiteSuppressed();
  if (currentlySuppressed) {
    await unsnoozeCurrentSiteUntilNewIncidentChanges();
    if (!ignorePreferences) {
      removeInlinePopup();
      return;
    }
  }

  const hideWhenNoIncidents = await isHideWhenNoIncidentsEnabled();
  const incidentSignature = buildIncidentSignature(visibleMatches);
  const hasIncidents = incidentSignature.length > 0;
  if (!ignorePreferences && hideWhenNoIncidents && !hasIncidents) {
    removeInlinePopup();
    return;
  }

  const currentlySnoozed = currentlySuppressed
    ? false
    : await isCurrentSiteSnoozedUntilIncidentChanges(incidentSignature);
  if (!ignorePreferences && currentlySnoozed) {
    removeInlinePopup();
    return;
  }

  if (visibleMatches.length === 0 && !ignorePreferences) {
    removeInlinePopup();
    return;
  }

  forcePopupVisible = ignorePreferences;
  const root = ensurePopupRoot();
  if (visibleMatches.length === 0) {
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
      void renderInlinePopup(visibleMatches, true);
      return;
    }

    await setWarningsEnabled(false);
    removeInlinePopup();
  };

  const handleSuppressSiteClick = async () => {
    if (ignorePreferences && currentlySuppressed) {
      await unsuppressCurrentSite();
      void renderInlinePopup(matches, true);
      return;
    }

    await suppressCurrentSite();
    removeInlinePopup();
  };

  const handleSnoozeUntilNewChangesClick = async () => {
    if (currentlySnoozed) {
      await unsnoozeCurrentSiteUntilNewIncidentChanges(incidentSignature);
      void renderInlinePopup(matches, true);
      return;
    }

    await snoozeCurrentSiteUntilNewIncidentChanges(incidentSignature);
    removeInlinePopup();
  };

  root.render(
    <InlinePopup
      matches={visibleMatches}
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
          : "Always hide for this site"
      }
      suppressButtonTooltip={
        ignorePreferences && currentlySuppressed
          ? "Show alerts for this site again."
          : "Hide alerts for this site until you choose to show them again."
      }
      snoozeUntilNewChangesLabel={
        currentlySuppressed
          ? undefined
          : currentlySnoozed
            ? "Resume alerts"
            : SNOOZE_UNTIL_NEW_CHANGES_LABEL
      }
      snoozeUntilNewChangesTooltip={
        currentlySuppressed
          ? undefined
          : currentlySnoozed
            ? "Turn alerts back on for this site."
            : "Hide alerts until there are new incidents."
      }
      onSnoozeUntilNewChanges={
        currentlySuppressed
          ? undefined
          : () => void handleSnoozeUntilNewChangesClick()
      }
      onSuppressSite={() => void handleSuppressSiteClick()}
    />,
  );
};

const runContentScript = async () => {
  if (!(await isWarningsEnabled()) || (await isCurrentSiteSuppressed())) {
    removeInlinePopup();
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
  const amazonMarketplaceProperties = extractAmazonMarketplaceProperties(
    document,
    location.hostname,
  );
  const ebayJsonLdMarketplaceProperties = extractEbayJsonLdProductProperties(
    document,
    location.hostname,
  );
  const marketplaceProperties =
    amazonMarketplaceProperties || ebayJsonLdMarketplaceProperties
      ? {
          ...(amazonMarketplaceProperties || {}),
          ...(ebayJsonLdMarketplaceProperties || {}),
        }
      : undefined;

  const context: PageContext = {
    url: location.href,
    hostname: location.hostname.toLowerCase(),
    title: (document.title || "").trim(),
    meta: {
      title: metaTitle,
      description,
      "og:title": ogTitle,
      "og:description": ogDescription,
    },
    marketplaceProperties,
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
  if (instruction.toggle) {
    if (isInlinePopupOpen()) {
      removeInlinePopup();
      return;
    }

    void renderInlinePopup(instruction.matches, true);
    return;
  }

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
    if (
      changes[Constants.STORAGE.SNOOZED_SITES_UNTIL_INCIDENT_CHANGE] ||
      changes[Constants.STORAGE.HIDE_WHEN_NO_INCIDENTS]
    ) {
      void runContentScript();
    }
  };

  void syncPopupStateWithStorage();
});

void runContentScript();

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { CargoEntry, PageContext } from "@/shared/types";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";
import { InlinePopup } from "@/content/InlinePopup";

console.log(
  `${Constants.LOG_PREFIX} Content script loaded on:`,
  window.location.href,
);

const POPUP_ID = "crw-inline-alert";

let popupHost: HTMLDivElement | null = null;
let popupRoot: Root | null = null;

const normalizeHostname = (hostname: string): string => {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
};

const getSuppressedDomains = async (): Promise<string[]> => {
  const stored = await browser.storage.local.get(Constants.STORAGE.SUPPRESSED_DOMAINS);
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

const suppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  if (domains.includes(current)) return;
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: [...domains, current],
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
  if (popupRoot) {
    popupRoot.unmount();
  }
  popupRoot = null;
  if (popupHost?.isConnected) {
    popupHost.remove();
  }
  popupHost = null;
};

const renderInlinePopup = async (matches: CargoEntry[]) => {
  if (matches.length === 0) {
    removeInlinePopup();
    return;
  }

  if (await isCurrentSiteSuppressed()) {
    removeInlinePopup();
    return;
  }

  const root = ensurePopupRoot();
  root.render(
    <InlinePopup
      matches={matches}
      logoUrl={browser.runtime.getURL("crw_logo.png")}
      externalIconUrl={browser.runtime.getURL("open-in-new.svg")}
      onClose={removeInlinePopup}
      onSuppressSite={() => {
        void (async () => {
          await suppressCurrentSite();
          removeInlinePopup();
        })();
      }}
    />,
  );
};

const runContentScript = async () => {
  if (await isCurrentSiteSuppressed()) {
    removeInlinePopup();
    return;
  }

  const getMetaContent = (selector: string): string => {
    return (document.querySelector(selector)?.getAttribute("content") || "").trim();
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

const isMatchUpdateMessage = (
  message: unknown,
): message is { type: MessageType; payload?: unknown } => {
  if (!message || typeof message !== "object") return false;
  const typed = message as { type?: MessageType };
  return typed.type === MessageType.MATCH_RESULTS_UPDATED;
};

browser.runtime.onMessage.addListener((msg: unknown) => {
  if (!isMatchUpdateMessage(msg)) return;
  const matches = (msg.payload as CargoEntry[]) || [];
  void renderInlinePopup(matches);
});

void runContentScript();

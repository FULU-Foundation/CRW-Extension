import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";

const POPUP_BG = "#004080";
const POPUP_TEXT = "#FFFFFF";

const normalizeHostname = (hostname: string): string => {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
};

const safeRuntimeUrl = (assetPath: string): string => {
  try {
    return browser.runtime.getURL(assetPath);
  } catch {
    return `/${assetPath}`;
  }
};

const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("unknown");
  const [articles, setArticles] = useState<CargoEntry[]>([]);
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tabId = tab?.id;
        const url = tab?.url;

        if (url) {
          const normalizedDomain = normalizeHostname(new URL(url).hostname);
          setDomain(normalizedDomain);
          const suppressedStored = await browser.storage.local.get(
            Constants.STORAGE.SUPPRESSED_DOMAINS,
          );
          const suppressedRaw =
            suppressedStored[Constants.STORAGE.SUPPRESSED_DOMAINS];
          const suppressedDomains = Array.isArray(suppressedRaw)
            ? suppressedRaw.filter(
                (entry): entry is string => typeof entry === "string",
              )
            : [];
          setSuppressed(
            suppressedDomains.map(normalizeHostname).includes(normalizedDomain),
          );
        }

        if (!tabId) return;

        const storageKey = Constants.STORAGE.MATCHES(tabId);
        const stored = await browser.storage.local.get(storageKey);
        const results = (stored[storageKey] as CargoEntry[]) || [];
        setArticles(results);
      } catch {
        setDomain("unknown");
        setSuppressed(false);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const suppressDomain = async () => {
    if (!domain || domain === "unknown") return;
    const key = Constants.STORAGE.SUPPRESSED_DOMAINS;
    const stored = await browser.storage.local.get(key);
    const existingRaw = stored[key];
    const existing = Array.isArray(existingRaw)
      ? existingRaw.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [];
    const normalized = normalizeHostname(domain);
    if (!normalized || existing.map(normalizeHostname).includes(normalized)) {
      window.close();
      return;
    }

    await browser.storage.local.set({
      [key]: [...existing, normalized],
    });
    setSuppressed(true);
    window.close();
  };

  const unsuppressDomain = async () => {
    if (!domain || domain === "unknown") return;
    const key = Constants.STORAGE.SUPPRESSED_DOMAINS;
    const stored = await browser.storage.local.get(key);
    const existingRaw = stored[key];
    const existing = Array.isArray(existingRaw)
      ? existingRaw.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [];
    const normalized = normalizeHostname(domain);
    const next = existing.filter(
      (entry) => normalizeHostname(entry) !== normalized,
    );
    await browser.storage.local.set({
      [key]: next,
    });
    setSuppressed(false);
    window.close();
  };

  if (loading) {
    return (
      <div
        style={{
          width: "500px",
          minHeight: "240px",
          background: POPUP_BG,
          color: POPUP_TEXT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif,system-ui,sans-serif",
        }}
      >
        Checking Consumer Rights Wiki matches...
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div
        style={{
          width: "500px",
          minHeight: "240px",
          background: POPUP_BG,
          color: POPUP_TEXT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontFamily: "ui-sans-serif,system-ui,sans-serif",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <img
          src={safeRuntimeUrl("crw_logo.png")}
          alt="Consumer Rights Wiki"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "8px",
          }}
        />
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          There are no matches on the Consumer Rights Wiki.
        </h2>
      </div>
    );
  }

  if (suppressed) {
    return (
      <div
        style={{
          width: "500px",
          minHeight: "240px",
          background: POPUP_BG,
          color: POPUP_TEXT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontFamily: "ui-sans-serif,system-ui,sans-serif",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <div>Alerts are disabled for {domain}.</div>
        <button
          type="button"
          onClick={() => {
            void unsuppressDomain();
          }}
          style={{
            border: "1px solid #FFFFFF",
            background: "#FFFFFF",
            color: "#004080",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Enable alerts for this site
        </button>
      </div>
    );
  }

  return (
    <MatchPopupCard
      matches={articles}
      logoUrl={safeRuntimeUrl("crw_logo.png")}
      externalIconUrl={safeRuntimeUrl("open-in-new.svg")}
      onSuppressSite={() => {
        void suppressDomain();
      }}
      domainLabel={domain}
      hideRelatedButtonWhenEmpty
      containerStyle={{
        width: "500px",
        height: "560px",
        maxHeight: "85vh",
      }}
    />
  );
};

export default Popup;

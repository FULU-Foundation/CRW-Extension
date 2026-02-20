import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { CargoEntry } from "@/shared/types";

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

const entryUrl = (entry: CargoEntry): string => {
  return `https://consumerrights.wiki/${encodeURIComponent(entry.PageName)}`;
};

const getEntryDescription = (entry: CargoEntry): string => {
  if (typeof entry.Description === "string" && entry.Description.trim()) {
    return entry.Description;
  }
  if (entry.Description == null) return "No description available.";
  if (
    typeof entry.Description === "number" ||
    typeof entry.Description === "boolean"
  ) {
    return String(entry.Description);
  }
  return "No description available.";
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

  const openOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  const openWiki = () => {
    void browser.tabs.create({ url: "https://consumerrights.wiki" });
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
          No mentions found on the Consumer Rights Wiki.
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
    <div
      style={{
        width: "500px",
        maxWidth: "100vw",
        maxHeight: "85vh",
        background: POPUP_BG,
        color: POPUP_TEXT,
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minWidth: 0,
        }}
      >
        <img
          src={safeRuntimeUrl("crw_logo.png")}
          alt="Consumer Rights Wiki"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Consumer Rights Wiki
          </div>
          <div
            style={{
              fontSize: "12px",
              opacity: 0.82,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {domain}
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: "10px",
          padding: "8px 10px",
          fontSize: "12px",
          opacity: 0.9,
        }}
      >
        {articles.length} matched page{articles.length === 1 ? "" : "s"}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflowY: "auto",
          minHeight: 0,
          flex: 1,
        }}
      >
        {articles.map((entry) => (
          <div
            key={`${entry._type}:${entry.PageID}`}
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "10px",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.PageName}
              </div>
              <div
                style={{
                  marginTop: "3px",
                  fontSize: "11px",
                  lineHeight: 1.3,
                  opacity: 0.85,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal",
                }}
              >
                {getEntryDescription(entry)}
              </div>
            </div>
            <a
              href={entryUrl(entry)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 0,
                border: "1px solid #FFFFFF",
                background: "#FFFFFF",
                color: "#004080",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                textDecoration: "none",
                alignSelf: "center",
              }}
            >
              View
            </a>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={openWiki}
          style={{
            border: "1px solid rgba(255,255,255,0.38)",
            background: "transparent",
            color: "#FFFFFF",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Open Wiki
        </button>
        <button
          type="button"
          onClick={openOptions}
          style={{
            border: "1px solid rgba(255,255,255,0.38)",
            background: "transparent",
            color: "#FFFFFF",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Options
        </button>
        <button
          type="button"
          onClick={() => {
            void suppressDomain();
          }}
          style={{
            border: "1px solid #FFFFFF",
            background: "#FFFFFF",
            color: "#004080",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Don&apos;t show for this site
        </button>
      </div>
    </div>
  );
};

export default Popup;

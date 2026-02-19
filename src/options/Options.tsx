import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";

const PAGE_CSS = {
  bg: "#004080",
  panel: "#004080",
  border: "rgba(255,255,255,0.25)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.82)",
  subtleBg: "rgba(255,255,255,0.08)",
  buttonText: "#004080",
  buttonBg: "#FFFFFF",
  buttonBorder: "#FFFFFF",
};

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

const writeSuppressedDomains = async (domains: string[]): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: domains,
  });
};

const Options = () => {
  const [warningsEnabled, setWarningsEnabled] = useState<boolean>(true);
  const [suppressedDomains, setSuppressedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void (async () => {
      try {
        const [enabled, domains] = await Promise.all([
          readWarningsEnabled(),
          readSuppressedDomains(),
        ]);
        setWarningsEnabled(enabled);
        setSuppressedDomains(domains);
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_CSS.bg,
        color: PAGE_CSS.text,
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: `1px solid ${PAGE_CSS.border}`,
            borderRadius: "12px",
            padding: "10px 12px",
            background: PAGE_CSS.subtleBg,
          }}
        >
          <img
            src="/crw_logo.png"
            alt="Consumer Rights Wiki"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                lineHeight: 1.2,
                fontWeight: 700,
                color: PAGE_CSS.text,
              }}
            >
              Consumer Rights Wiki Options
            </h1>
            <div style={{ fontSize: "12px", color: PAGE_CSS.muted }}>
              Popup preferences and ignored sites
            </div>
          </div>
        </div>

        <section
          style={{
            border: `1px solid ${PAGE_CSS.border}`,
            borderRadius: "12px",
            padding: "14px",
            background: PAGE_CSS.subtleBg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: 1.2,
              fontWeight: 700,
              color: PAGE_CSS.text,
            }}
          >
            Show On Page Load
          </h2>
          <p style={{ margin: "6px 0 10px 0", fontSize: "13px", color: PAGE_CSS.muted }}>
            Controls the in-page popup. Turning this off is the same behavior as
            using "Don&apos;t show me this again".
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${PAGE_CSS.border}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "14px",
              color: PAGE_CSS.text,
            }}
          >
            <span>Show on page load</span>
            <input
              type="checkbox"
              checked={warningsEnabled}
              disabled={loading}
              onChange={(event) => {
                void onToggleWarnings(event.target.checked);
              }}
              style={{ width: "16px", height: "16px", accentColor: "#FFFFFF" }}
            />
          </label>

          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: PAGE_CSS.muted }}>
            {warningsEnabled
              ? "Enabled: matching popups can show automatically."
              : "Disabled: popups will not auto-show on page load."}
          </p>
        </section>

        <section
          style={{
            border: `1px solid ${PAGE_CSS.border}`,
            borderRadius: "12px",
            padding: "14px",
            background: PAGE_CSS.subtleBg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: 1.2,
              fontWeight: 700,
              color: PAGE_CSS.text,
            }}
          >
            Ignored Sites
          </h2>
          <p style={{ margin: "6px 0 10px 0", fontSize: "13px", color: PAGE_CSS.muted }}>
            Remove a site from this list to start showing popups there again.
          </p>

          {suppressedDomains.length === 0 && (
            <div
              style={{
                border: `1px solid ${PAGE_CSS.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "13px",
                color: PAGE_CSS.muted,
              }}
            >
              No ignored sites.
            </div>
          )}

          {suppressedDomains.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {suppressedDomains.map((domain) => (
                <div
                  key={domain}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    border: `1px solid ${PAGE_CSS.border}`,
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "13px",
                    color: PAGE_CSS.text,
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {domain}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void onRemoveSuppressedDomain(domain);
                    }}
                    style={{
                      border: `1px solid ${PAGE_CSS.buttonBorder}`,
                      background: PAGE_CSS.buttonBg,
                      color: PAGE_CSS.buttonText,
                      borderRadius: "8px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Options;

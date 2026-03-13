import React from "react";
import { SuppressedDomain, SuppressedPageName } from "@/shared/types";

const PAGE_CSS = {
  bg: "#004080",
  border: "rgba(255,255,255,0.25)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.82)",
  subtleBg: "rgba(255,255,255,0.08)",
  buttonText: "#004080",
  buttonBg: "#FFFFFF",
  buttonBorder: "#FFFFFF",
};

const REFRESH_INTERVAL_OPTIONS = [
  { value: 60 * 60 * 1000, label: "1 hour" },
  { value: 12 * 60 * 60 * 1000, label: "12 hours" },
  { value: 24 * 60 * 60 * 1000, label: "24 hours" },
  { value: 7 * 24 * 60 * 60 * 1000, label: "1 week" },
] as const;

export type OptionsViewProps = {
  warningsEnabled: boolean;
  suppressedDomains: SuppressedDomain[];
  suppressedPageNames: SuppressedPageName[];
  refreshIntervalMs: number;
  lastRefreshedAt: number | null;
  refreshingNow: boolean;
  refreshError: string | null;
  lastRefreshError: string | null;
  loading: boolean;
  onToggleWarnings: (enabled: boolean) => void;
  onChangeRefreshInterval: (refreshIntervalMs: number) => void;
  onRefreshNow: () => void;
  onRemoveSuppressedDomain: (domain: string) => void;
  onRemoveSuppressedPageName: (pageName: string) => void;
};

const formatLastRefreshed = (value: number | null): string => {
  if (typeof value !== "number") return "Never";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const OptionsView = (props: OptionsViewProps) => {
  const {
    warningsEnabled,
    suppressedDomains,
    suppressedPageNames,
    refreshIntervalMs,
    lastRefreshedAt,
    refreshingNow,
    refreshError,
    lastRefreshError,
    loading,
    onToggleWarnings,
    onChangeRefreshInterval,
    onRefreshNow,
    onRemoveSuppressedDomain,
    onRemoveSuppressedPageName,
  } = props;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_CSS.bg,
        color: PAGE_CSS.text,
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
      }}
    >
      <style>
        {
          "@keyframes crwOptionsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
        }
      </style>
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
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
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
                onToggleWarnings(event.target.checked);
              }}
              style={{ width: "16px", height: "16px", accentColor: "#FFFFFF" }}
            />
          </label>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: PAGE_CSS.muted,
            }}
          >
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
            Hidden Products and Companies
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Remove an item from this list to show matches for it again.
          </p>

          {suppressedPageNames.length === 0 && (
            <div
              style={{
                border: `1px solid ${PAGE_CSS.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "13px",
                color: PAGE_CSS.muted,
              }}
            >
              No hidden products or companies.
            </div>
          )}

          {suppressedPageNames.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {suppressedPageNames.map((entry) => (
                <div
                  key={entry.name}
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
                    {entry.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveSuppressedPageName(entry.name);
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
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {suppressedDomains.map((entry) => (
                <div
                  key={entry.name}
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
                    {entry.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveSuppressedDomain(entry.name);
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
            Data Refresh
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Choose how often the extension checks for updated data.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              border: `1px solid ${PAGE_CSS.border}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "13px",
              color: PAGE_CSS.text,
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span>Refresh interval</span>
              <select
                value={String(refreshIntervalMs)}
                disabled={loading || refreshingNow}
                onChange={(event) => {
                  onChangeRefreshInterval(Number(event.target.value));
                }}
                style={{
                  borderRadius: "8px",
                  border: `1px solid ${PAGE_CSS.buttonBorder}`,
                  background: "#FFFFFF",
                  color: PAGE_CSS.buttonText,
                  padding: "7px 10px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {REFRESH_INTERVAL_OPTIONS.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ fontSize: "12px", color: PAGE_CSS.muted }}>
              Last refreshed: {formatLastRefreshed(lastRefreshedAt)}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={loading || refreshingNow}
                onClick={onRefreshNow}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: `1px solid ${PAGE_CSS.buttonBorder}`,
                  background: PAGE_CSS.buttonBg,
                  color: PAGE_CSS.buttonText,
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: loading || refreshingNow ? "default" : "pointer",
                  opacity: loading ? 0.75 : 1,
                }}
              >
                <img
                  src="/refresh.svg"
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "14px",
                    height: "14px",
                    flexShrink: 0,
                    animation: refreshingNow
                      ? "crwOptionsSpin 0.9s linear infinite"
                      : "none",
                  }}
                />
                {refreshingNow ? "Refreshing..." : "Refresh now"}
              </button>

              {refreshError && (
                <span style={{ fontSize: "12px", color: "#FFE2E2" }}>
                  {refreshError}
                </span>
              )}
            </div>

            {lastRefreshError && (
              <div style={{ fontSize: "12px", color: "#FFE2E2" }}>
                Last fetch error: {lastRefreshError}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

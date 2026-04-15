import React from "react";
import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";

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

const POPUP_POSITION_OPTIONS: {
  value: PopupPosition;
  label: string;
  corner: [boolean, boolean];
}[] = [
  { value: "top-left", label: "Top left", corner: [false, true] },
  { value: "top-right", label: "Top right", corner: [false, false] },
  { value: "bottom-left", label: "Bottom left", corner: [true, true] },
  { value: "bottom-right", label: "Bottom right", corner: [true, false] },
];

const CURSOR_OUT_BEHAVIOR_OPTIONS: {
  value: AutoDismissCursorOutBehavior;
  label: string;
  description: string;
}[] = [
  {
    value: "continue",
    label: "Continue",
    description: "Keep counting down after cursor leaves",
  },
  {
    value: "reset",
    label: "Reset",
    description: "Restart the countdown after cursor enters",
  },
];

export type OptionsViewProps = {
  warningsEnabled: boolean;
  hideWhenNoIncidents: boolean;
  suppressedDomains: string[];
  snoozedSites: string[];
  refreshIntervalMs: number;
  lastRefreshedAt: number | null;
  refreshingNow: boolean;
  refreshError: string | null;
  lastRefreshError: string | null;
  loading: boolean;
  popupPosition: PopupPosition;
  autoDismissEnabled: boolean;
  autoDismissTimeoutMs: number;
  autoDismissShowProgressBar: boolean;
  autoDismissCursorOutBehavior: AutoDismissCursorOutBehavior;
  autoDismissHoverCancelMs: number;
  onToggleWarnings: (enabled: boolean) => void;
  onToggleHideWhenNoIncidents: (enabled: boolean) => void;
  onChangeRefreshInterval: (refreshIntervalMs: number) => void;
  onRefreshNow: () => void;
  onRemoveSuppressedDomain: (domain: string) => void;
  onRemoveSnoozedSite: (domain: string) => void;
  onChangePopupPosition: (position: PopupPosition) => void;
  onToggleAutoDismiss: (enabled: boolean) => void;
  onChangeAutoDismissTimeoutMs: (ms: number) => void;
  onToggleAutoDismissShowProgressBar: (show: boolean) => void;
  onChangeAutoDismissCursorOutBehavior: (
    behavior: AutoDismissCursorOutBehavior,
  ) => void;
  onChangeAutoDismissHoverCancelMs: (ms: number) => void;
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
    hideWhenNoIncidents,
    suppressedDomains,
    snoozedSites,
    refreshIntervalMs,
    lastRefreshedAt,
    refreshingNow,
    refreshError,
    lastRefreshError,
    loading,
    popupPosition,
    autoDismissEnabled,
    autoDismissTimeoutMs,
    autoDismissShowProgressBar,
    autoDismissCursorOutBehavior,
    autoDismissHoverCancelMs,
    onToggleWarnings,
    onToggleHideWhenNoIncidents,
    onChangeRefreshInterval,
    onRefreshNow,
    onRemoveSuppressedDomain,
    onRemoveSnoozedSite,
    onChangePopupPosition,
    onToggleAutoDismiss,
    onChangeAutoDismissTimeoutMs,
    onToggleAutoDismissShowProgressBar,
    onChangeAutoDismissCursorOutBehavior,
    onChangeAutoDismissHoverCancelMs,
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
        {`
          body { margin: 0; }
          @keyframes crwOptionsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}
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
            Controls the in-page popup. When disabled, the popup will not appear
            automatically but can still be opened via the extensions icon.
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
            Automatic Popup Filters
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Control when automatic in-page popups are shown.
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
            <span>Don&apos;t show matches when there are no incidents</span>
            <input
              type="checkbox"
              checked={hideWhenNoIncidents}
              disabled={loading}
              onChange={(event) => {
                onToggleHideWhenNoIncidents(event.target.checked);
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
            {hideWhenNoIncidents
              ? "Enabled: automatic popups are hidden unless incident matches are present."
              : "Disabled: automatic popups can show even without incident matches."}
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
            Popup Position
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Choose which corner of the screen the popup appears in. On mobile
            devices it always appears at the bottom center.
          </p>

          <div
            role="radiogroup"
            aria-label="Popup position"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {POPUP_POSITION_OPTIONS.map((option) => {
              const [isBottom, isLeft] = option.corner;
              const selected = popupPosition === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={loading}
                  onClick={() => onChangePopupPosition(option.value)}
                  style={{
                    border: `1px solid ${selected ? PAGE_CSS.text : PAGE_CSS.border}`,
                    borderRadius: "10px",
                    padding: "10px",
                    background: selected
                      ? "rgba(255,255,255,0.18)"
                      : "transparent",
                    color: PAGE_CSS.text,
                    cursor: loading ? "default" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "50%",
                      border: `1px solid ${PAGE_CSS.border}`,
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: "36%",
                        height: "40%",
                        background: selected
                          ? PAGE_CSS.text
                          : "rgba(255,255,255,0.5)",
                        borderRadius: "3px",
                        ...(isBottom ? { bottom: "6px" } : { top: "6px" }),
                        ...(isLeft ? { left: "6px" } : { right: "6px" }),
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: selected ? 700 : 400,
                      textAlign: "center",
                    }}
                  >
                    {option.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Auto-Dismiss section */}
        <section
          aria-labelledby="auto-dismiss-heading"
          style={{
            border: `1px solid ${PAGE_CSS.border}`,
            borderRadius: "12px",
            padding: "14px",
            background: PAGE_CSS.subtleBg,
          }}
        >
          <h2
            id="auto-dismiss-heading"
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: 1.2,
              fontWeight: 700,
              color: PAGE_CSS.text,
            }}
          >
            Auto-Dismiss
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Automatically close the popup after a set time. Pauses while your
            cursor is over it.
          </p>

          {/* Enable toggle */}
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
            <span>Enable auto-dismiss</span>
            <input
              type="checkbox"
              checked={autoDismissEnabled}
              disabled={loading}
              onChange={(e) => onToggleAutoDismiss(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#FFFFFF" }}
            />
          </label>

          {autoDismissEnabled && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {/* Timeout duration */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  border: `1px solid ${PAGE_CSS.border}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: PAGE_CSS.text,
                }}
              >
                <label
                  htmlFor="auto-dismiss-timeout"
                  style={{ fontSize: "14px", color: PAGE_CSS.text }}
                >
                  Dismiss after (seconds)
                </label>
                <input
                  id="auto-dismiss-timeout"
                  type="number"
                  min={3}
                  max={300}
                  step={1}
                  value={autoDismissTimeoutMs / 1000}
                  disabled={loading}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    const seconds = Math.max(
                      3,
                      Math.min(300, Math.round(Number(e.target.value))),
                    );
                    if (!Number.isNaN(seconds)) {
                      onChangeAutoDismissTimeoutMs(seconds * 1000);
                    }
                  }}
                  style={{
                    borderRadius: "8px",
                    border: `1px solid ${PAGE_CSS.buttonBorder}`,
                    background: "#FFFFFF",
                    color: PAGE_CSS.buttonText,
                    padding: "7px 10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    width: "80px",
                  }}
                />
              </div>

              {/* Show progress bar toggle */}
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
                <span>Show progress bar</span>
                <input
                  type="checkbox"
                  checked={autoDismissShowProgressBar}
                  disabled={loading}
                  onChange={(e) =>
                    onToggleAutoDismissShowProgressBar(e.target.checked)
                  }
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#FFFFFF",
                  }}
                />
              </label>

              {/* Cursor-out behaviour */}
              <fieldset
                style={{
                  border: `1px solid ${PAGE_CSS.border}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  margin: 0,
                }}
              >
                <legend
                  style={{
                    fontSize: "14px",
                    color: PAGE_CSS.text,
                    padding: "0 4px",
                  }}
                >
                  After cursor leaves popup
                </legend>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "6px",
                  }}
                >
                  {CURSOR_OUT_BEHAVIOR_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        cursor: loading ? "default" : "pointer",
                        opacity: loading ? 0.75 : 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="cursorOutBehavior"
                        value={option.value}
                        checked={autoDismissCursorOutBehavior === option.value}
                        disabled={loading}
                        onChange={() =>
                          onChangeAutoDismissCursorOutBehavior(option.value)
                        }
                        style={{ marginTop: "2px", accentColor: "#FFFFFF" }}
                      />
                      <span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: PAGE_CSS.text,
                            display: "block",
                          }}
                        >
                          {option.label}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: PAGE_CSS.muted,
                            display: "block",
                          }}
                        >
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Hover-cancel grace period */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  border: `1px solid ${PAGE_CSS.border}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: PAGE_CSS.text,
                }}
              >
                <label
                  htmlFor="hover-cancel-ms"
                  style={{ fontSize: "14px", color: PAGE_CSS.text }}
                >
                  Hovering cancels fade-out for (ms)
                </label>
                <span
                  style={{
                    fontSize: "12px",
                    color: PAGE_CSS.muted,
                  }}
                >
                  Set to 0 to disable. Default: 750
                </span>
                <input
                  id="hover-cancel-ms"
                  type="number"
                  min={0}
                  max={60000}
                  step={50}
                  value={autoDismissHoverCancelMs}
                  disabled={loading}
                  onChange={(e) => {
                    const ms = Math.max(
                      0,
                      Math.min(60000, Math.round(Number(e.target.value))),
                    );
                    if (!Number.isNaN(ms)) {
                      onChangeAutoDismissHoverCancelMs(ms);
                    }
                  }}
                  style={{
                    borderRadius: "8px",
                    border: `1px solid ${PAGE_CSS.buttonBorder}`,
                    background: "#FFFFFF",
                    color: PAGE_CSS.buttonText,
                    padding: "7px 10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    width: "100px",
                  }}
                />
              </div>
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
                      onRemoveSuppressedDomain(domain);
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
            Snoozed Sites
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            These sites are snoozed until incident matches change.
          </p>

          {snoozedSites.length === 0 && (
            <div
              style={{
                border: `1px solid ${PAGE_CSS.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "13px",
                color: PAGE_CSS.muted,
              }}
            >
              No snoozed sites.
            </div>
          )}

          {snoozedSites.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {snoozedSites.map((domain) => (
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
                      onRemoveSnoozedSite(domain);
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

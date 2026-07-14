import React, { useEffect, useState } from "react";
import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";
import { type ShortcutCommandBinding } from "@/shared/shortcuts";

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

const ABOUT_LINKS = [
  {
    href: "https://github.com/FULU-Foundation/CRW-Extension",
    label: "Source code on GitHub",
  },
  {
    href: "https://github.com/FULU-Foundation/CRW-Extension/issues",
    label: "Report a bug or request a feature",
  },
  {
    href: "https://consumerrights.wiki",
    label: "Visit the Consumer Rights Wiki",
  },
] as const;

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

type BoundedNumberInputProps = {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  width: string;
  onChange: (value: number) => void;
};

const BoundedNumberInput = ({
  id,
  value,
  min,
  max,
  step,
  disabled,
  width,
  onChange,
}: BoundedNumberInputProps) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!draft.trim() || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    const next = Math.max(min, Math.min(max, Math.round(parsed)));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      disabled={disabled}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);

        const parsed = Number(nextDraft);
        if (
          nextDraft.trim() &&
          Number.isFinite(parsed) &&
          Number.isInteger(parsed) &&
          parsed >= min &&
          parsed <= max &&
          parsed !== value
        ) {
          onChange(parsed);
        }
      }}
      onBlur={commitDraft}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(String(value));
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
        width,
      }}
    />
  );
};

export type OptionsViewProps = {
  warningsEnabled: boolean;
  hideWhenNoIncidents: boolean;
  suppressedDomains: string[];
  snoozedSites: string[];
  snoozedVendors: string[];
  refreshIntervalMs: number;
  lastRefreshedAt: number | null;
  refreshingNow: boolean;
  refreshError: string | null;
  lastRefreshError: string | null;
  shortcutBindings: ShortcutCommandBinding[];
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
  onOpenShortcutSettings: () => void;
  onRemoveSuppressedDomain: (domain: string) => void;
  onRemoveSnoozedSite: (domain: string) => void;
  onRemoveSnoozedVendor: (companyName: string) => void;
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
    snoozedVendors,
    refreshIntervalMs,
    lastRefreshedAt,
    refreshingNow,
    refreshError,
    lastRefreshError,
    shortcutBindings,
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
    onOpenShortcutSettings,
    onRemoveSuppressedDomain,
    onRemoveSnoozedSite,
    onRemoveSnoozedVendor,
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
            Keyboard Shortcuts
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            Keyboard shortcuts are managed by your browser. Use the browser
            shortcut settings page to add or change bindings for these actions.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {shortcutBindings.map((binding) => (
              <div
                key={binding.name}
                style={{
                  border: `1px solid ${PAGE_CSS.border}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: PAGE_CSS.text,
                  }}
                >
                  {binding.label}
                </div>
                <div style={{ fontSize: "12px", color: PAGE_CSS.muted }}>
                  {binding.description}
                </div>
                <div style={{ fontSize: "12px", color: PAGE_CSS.text }}>
                  Current: {binding.shortcut || "Not set"}
                </div>
                <div style={{ fontSize: "12px", color: PAGE_CSS.muted }}>
                  Suggested: {binding.suggestedBinding}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "10px" }}>
            <button
              type="button"
              onClick={onOpenShortcutSettings}
              style={{
                border: `1px solid ${PAGE_CSS.buttonBorder}`,
                background: PAGE_CSS.buttonBg,
                color: PAGE_CSS.buttonText,
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Manage shortcuts
            </button>
          </div>
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
                <BoundedNumberInput
                  id="auto-dismiss-timeout"
                  min={3}
                  max={300}
                  step={1}
                  value={autoDismissTimeoutMs / 1000}
                  disabled={loading}
                  width="80px"
                  onChange={(seconds) =>
                    onChangeAutoDismissTimeoutMs(seconds * 1000)
                  }
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
                  Hover cancel grace period (ms)
                </label>
                <span
                  style={{
                    fontSize: "12px",
                    color: PAGE_CSS.muted,
                  }}
                >
                  Set to 0 to disable. Default: 500
                </span>
                <BoundedNumberInput
                  id="hover-cancel-ms"
                  min={0}
                  max={60000}
                  step={50}
                  value={autoDismissHoverCancelMs}
                  disabled={loading}
                  width="100px"
                  onChange={onChangeAutoDismissHoverCancelMs}
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
            Snoozed Companies
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            These companies are snoozed on all of their sites until incident
            matches change.
          </p>

          {snoozedVendors.length === 0 && (
            <div
              style={{
                border: `1px solid ${PAGE_CSS.border}`,
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "13px",
                color: PAGE_CSS.muted,
              }}
            >
              No snoozed companies.
            </div>
          )}

          {snoozedVendors.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {snoozedVendors.map((companyName) => (
                <div
                  key={companyName}
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
                    {companyName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveSnoozedVendor(companyName);
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
            About &amp; Feedback
          </h2>
          <p
            style={{
              margin: "6px 0 10px 0",
              fontSize: "13px",
              color: PAGE_CSS.muted,
            }}
          >
            This extension is open source and maintained by the FULU Foundation.
            Found a bug or have a suggestion? Let us know.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              border: `1px solid ${PAGE_CSS.border}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "13px",
            }}
          >
            {ABOUT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: PAGE_CSS.text,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { OptionsView } from "../src/options/OptionsView.tsx";
import type { DisplayMode } from "../src/shared/constants.ts";
import { getDefaultShortcutBindings } from "../src/shared/shortcuts.ts";

const noop = () => {};

const renderOptionsView = (overrides: Partial<Parameters<typeof OptionsView>[0]>) => {
  return renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: true,
      hideWhenNoIncidents: true,
      displayMode: "full-popup",
      suppressedDomains: [],
      snoozedSites: [],
      refreshIntervalMs: 24 * 60 * 60 * 1000,
      lastRefreshedAt: null,
      refreshingNow: false,
      refreshError: null,
      lastRefreshError: null,
      shortcutBindings: getDefaultShortcutBindings(),
      loading: false,
      popupPosition: "top-right",
      autoDismissEnabled: true,
      autoDismissTimeoutMs: 5000,
      autoDismissShowProgressBar: true,
      autoDismissCursorOutBehavior: "continue",
      autoDismissHoverCancelMs: 500,
      onToggleWarnings: noop,
      onToggleHideWhenNoIncidents: noop,
      onChangeDisplayMode: noop,
      onChangeRefreshInterval: noop,
      onRefreshNow: noop,
      onOpenShortcutSettings: noop,
      onRemoveSuppressedDomain: noop,
      onRemoveSnoozedSite: noop,
      onChangePopupPosition: noop,
      onToggleAutoDismiss: noop,
      onChangeAutoDismissTimeoutMs: noop,
      onToggleAutoDismissShowProgressBar: noop,
      onChangeAutoDismissCursorOutBehavior: noop,
      onChangeAutoDismissHoverCancelMs: noop,
      ...overrides,
    }),
  );
};

test("OptionsView shows enabled state and empty ignored-sites list", () => {
  const html = renderOptionsView({});

  assert.ok(html.includes("Show On Page Load"));
  assert.ok(html.includes("Enabled: matching popups can show automatically."));
  assert.ok(html.includes("Data Refresh"));
  assert.ok(html.includes("Keyboard Shortcuts"));
  assert.ok(html.includes("Auto-Dismiss"));
  assert.ok(html.includes("Dismiss after (seconds)"));
  assert.ok(html.includes("Manage shortcuts"));
  assert.ok(html.includes("Current: Not set"));
  assert.ok(html.includes("Suggested: Alt+Shift+P"));
  assert.ok(html.includes("1 hour"));
  assert.ok(html.includes("12 hours"));
  assert.ok(html.includes("24 hours"));
  assert.ok(html.includes("1 week"));
  assert.ok(html.includes("Last refreshed: Never"));
  assert.ok(html.includes("Refresh now"));
  assert.ok(html.includes("No ignored sites."));
  assert.ok(html.includes("No snoozed sites."));
  assert.ok(
    html.includes(
      "Enabled: automatic popups are hidden unless incident matches are present.",
    ),
  );
});

test("OptionsView shows disabled state and removable ignored-site entries", () => {
  const html = renderOptionsView({
      warningsEnabled: false,
      hideWhenNoIncidents: false,
      displayMode: "badge-only",
      suppressedDomains: ["example.com"],
      snoozedSites: ["shop.example"],
      refreshIntervalMs: 60 * 60 * 1000,
      lastRefreshedAt: Date.UTC(2026, 1, 22, 18, 30),
      refreshingNow: true,
      refreshError: "Refresh failed. Please try again.",
      lastRefreshError: "Failed to fetch dataset (500)",
      shortcutBindings: [
        {
          ...getDefaultShortcutBindings()[0],
          shortcut: "Alt+Shift+D",
        },
      ],
      loading: true,
      popupPosition: "bottom-left",
      autoDismissEnabled: false,
      autoDismissTimeoutMs: 10000,
      autoDismissShowProgressBar: false,
      autoDismissCursorOutBehavior: "reset",
      autoDismissHoverCancelMs: 0,
  });

  assert.ok(html.includes("Disabled: popups will not auto-show on page load."));
  assert.ok(html.includes("example.com"));
  assert.ok(html.includes("shop.example"));
  assert.ok(
    html.includes(
      "Disabled: automatic popups can show even without incident matches.",
    ),
  );
  assert.ok(html.includes("Remove"));
  assert.ok(html.includes("Current: Alt+Shift+D"));
  assert.ok(html.includes("Auto-Dismiss"));
  assert.ok(html.includes("Refreshing..."));
  assert.ok(html.includes("Refresh failed. Please try again."));
  assert.ok(html.includes("Last fetch error: Failed to fetch dataset (500)"));
  assert.ok(html.includes("disabled"));
});

test("OptionsView renders display mode choices and selected-mode help text", () => {
  const descriptions: Record<DisplayMode, string> = {
    "full-popup": "Full popup: Shows full popup on page with site info and incidents.",
    "badge-only": "Badge only: Shows number badge on extension icon.",
    "compact-badge": "Compact badge: Shows small badge with site name and count.",
  };

  for (const [displayMode, description] of Object.entries(descriptions)) {
    const html = renderOptionsView({ displayMode: displayMode as DisplayMode });

    assert.ok(html.includes("Display Mode"));
    assert.ok(
      html.includes(
        "Choose how matches are displayed on the page and extension icon.",
      ),
    );
    assert.ok(html.includes("Full popup"));
    assert.ok(html.includes("Badge only"));
    assert.ok(html.includes("Compact badge"));
    assert.ok(html.includes(description));
  }
});

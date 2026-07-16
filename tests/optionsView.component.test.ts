import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { OptionsView } from "../src/options/OptionsView.tsx";
import { getDefaultShortcutBindings } from "../src/shared/shortcuts.ts";

const noop = () => {};

test("OptionsView shows enabled state and empty ignored-sites list", () => {
  const html = renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: true,
      hideWhenNoIncidents: true,
      suppressedDomains: [],
      snoozedSites: [],
      hiddenIncidentCategories: [],
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
      onChangeRefreshInterval: noop,
      onRefreshNow: noop,
      onOpenShortcutSettings: noop,
      onRemoveSuppressedDomain: noop,
      onRemoveSnoozedSite: noop,
      onRestoreIncidentCategory: noop,
      onChangePopupPosition: noop,
      onToggleAutoDismiss: noop,
      onChangeAutoDismissTimeoutMs: noop,
      onToggleAutoDismissShowProgressBar: noop,
      onChangeAutoDismissCursorOutBehavior: noop,
      onChangeAutoDismissHoverCancelMs: noop,
    }),
  );

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
  assert.ok(html.includes("Hidden Categories"));
  assert.ok(html.includes("No hidden categories."));
  assert.ok(
    html.includes(
      "Enabled: automatic popups are hidden unless incident matches are present.",
    ),
  );
});

test("OptionsView shows disabled state and removable ignored-site entries", () => {
  const html = renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: false,
      hideWhenNoIncidents: false,
      suppressedDomains: ["example.com"],
      snoozedSites: ["shop.example"],
      hiddenIncidentCategories: ["Planned Obsolescence", "Privacy"],
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
      onToggleWarnings: noop,
      onToggleHideWhenNoIncidents: noop,
      onChangeRefreshInterval: noop,
      onRefreshNow: noop,
      onOpenShortcutSettings: noop,
      onRemoveSuppressedDomain: noop,
      onRemoveSnoozedSite: noop,
      onRestoreIncidentCategory: noop,
      onChangePopupPosition: noop,
      onToggleAutoDismiss: noop,
      onChangeAutoDismissTimeoutMs: noop,
      onToggleAutoDismissShowProgressBar: noop,
      onChangeAutoDismissCursorOutBehavior: noop,
      onChangeAutoDismissHoverCancelMs: noop,
    }),
  );

  assert.ok(html.includes("Disabled: popups will not auto-show on page load."));
  assert.ok(html.includes("example.com"));
  assert.ok(html.includes("shop.example"));
  assert.ok(html.includes("Privacy"));
  assert.ok(html.includes("Planned Obsolescence"));
  assert.ok(html.includes("Show again"));
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

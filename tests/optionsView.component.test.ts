import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { OptionsView } from "../src/options/OptionsView.tsx";

const noop = () => {};

test("OptionsView shows enabled state and empty ignored-sites list", () => {
  const html = renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: true,
      suppressedDomains: [],
      suppressedPageNames: [],
      refreshIntervalMs: 24 * 60 * 60 * 1000,
      lastRefreshedAt: null,
      refreshingNow: false,
      refreshError: null,
      lastRefreshError: null,
      loading: false,
      onToggleWarnings: noop,
      onChangeRefreshInterval: noop,
      onRefreshNow: noop,
      onRemoveSuppressedDomain: noop,
      onRemoveSuppressedPageName: noop,
    }),
  );

  assert.ok(html.includes("Show On Page Load"));
  assert.ok(html.includes("Enabled: matching popups can show automatically."));
  assert.ok(html.includes("Data Refresh"));
  assert.ok(html.includes("1 hour"));
  assert.ok(html.includes("12 hours"));
  assert.ok(html.includes("24 hours"));
  assert.ok(html.includes("1 week"));
  assert.ok(html.includes("Last refreshed: Never"));
  assert.ok(html.includes("Refresh now"));
  assert.ok(html.includes("No ignored sites."));
  assert.ok(html.includes("No hidden products or companies."));
});

test("OptionsView shows disabled state and removable ignored-site entries", () => {
  const html = renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: false,
      suppressedDomains: ["example.com"],
      suppressedPageNames: ["airpods"],
      refreshIntervalMs: 60 * 60 * 1000,
      lastRefreshedAt: Date.UTC(2026, 1, 22, 18, 30),
      refreshingNow: true,
      refreshError: "Refresh failed. Please try again.",
      lastRefreshError: "Failed to fetch dataset (500)",
      loading: true,
      onToggleWarnings: noop,
      onChangeRefreshInterval: noop,
      onRefreshNow: noop,
      onRemoveSuppressedDomain: noop,
      onRemoveSuppressedPageName: noop,
    }),
  );

  assert.ok(
    html.includes("Disabled: popups will not auto-show on page load."),
  );
  assert.ok(html.includes("example.com"));
  assert.ok(html.includes("airpods"));
  assert.ok(html.includes("Remove"));
  assert.ok(html.includes("Refreshing..."));
  assert.ok(html.includes("Refresh failed. Please try again."));
  assert.ok(html.includes("Last fetch error: Failed to fetch dataset (500)"));
  assert.ok(html.includes("disabled"));
});

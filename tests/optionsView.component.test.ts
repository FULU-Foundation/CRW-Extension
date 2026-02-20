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
      loading: false,
      onToggleWarnings: noop,
      onRemoveSuppressedDomain: noop,
    }),
  );

  assert.ok(html.includes("Show On Page Load"));
  assert.ok(html.includes("Enabled: matching popups can show automatically."));
  assert.ok(html.includes("No ignored sites."));
});

test("OptionsView shows disabled state and removable ignored-site entries", () => {
  const html = renderToStaticMarkup(
    React.createElement(OptionsView, {
      warningsEnabled: false,
      suppressedDomains: ["example.com"],
      loading: true,
      onToggleWarnings: noop,
      onRemoveSuppressedDomain: noop,
    }),
  );

  assert.ok(
    html.includes("Disabled: popups will not auto-show on page load."),
  );
  assert.ok(html.includes("example.com"));
  assert.ok(html.includes("Remove"));
  assert.ok(html.includes("disabled"));
});

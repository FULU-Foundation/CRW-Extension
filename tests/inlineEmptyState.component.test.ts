import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InlineEmptyState } from "../src/content/InlineEmptyState.tsx";

const noop = () => {};

test("InlineEmptyState renders CRW branding and empty-state message", () => {
  const html = renderToStaticMarkup(
    React.createElement(InlineEmptyState, {
      logoUrl: "/logo.png",
      settingsIconUrl: "/settings.svg",
      onOpenSettings: noop,
      onClose: noop,
    }),
  );

  assert.ok(html.includes("Consumer Rights Wiki"));
  assert.ok(html.includes("Open extension settings"));
  assert.ok(html.includes("There are no matching arcitcles."));
});

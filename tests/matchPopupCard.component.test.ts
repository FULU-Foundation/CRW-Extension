import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MatchPopupCard } from "../src/shared/ui/MatchPopupCard.tsx";
import { getIncidentTooltipText } from "../src/shared/ui/MatchPopupPrimitives.tsx";
import { entry } from "./helpers.ts";

const noop = () => {};

test("MatchPopupCard hides related pages button when requested and no related pages exist", () => {
  const html = renderToStaticMarkup(
    React.createElement(MatchPopupCard, {
      matches: [
        entry({
          _type: "Company",
          PageID: "company-apple",
          PageName: "Apple",
        }),
      ],
      logoUrl: "/logo.png",
      externalIconUrl: "/open-in-new.svg",
      onSuppressSite: noop,
      hideRelatedButtonWhenEmpty: true,
    }),
  );

  assert.equal(html.includes("related page"), false);
});

test("MatchPopupCard incident list shows first status token and sorts active incidents first", () => {
  const html = renderToStaticMarkup(
    React.createElement(MatchPopupCard, {
      matches: [
        entry({
          _type: "ProductLine",
          PageID: "pl-airpods",
          PageName: "AirPods",
          Company: "Apple",
        }),
        entry({
          _type: "Incident",
          PageID: "incident-resolved",
          PageName: "Resolved Incident",
          Company: "Apple",
          ProductLine: "AirPods",
          Status: "Closed, Monitoring",
          StartDate: "2026-02-01",
        }),
        entry({
          _type: "Incident",
          PageID: "incident-active",
          PageName: "Active Incident",
          Company: "Apple",
          ProductLine: "AirPods",
          Status: "Active, Investigating",
          StartDate: "2025-01-01",
        }),
      ],
      logoUrl: "/logo.png",
      externalIconUrl: "/open-in-new.svg",
      onSuppressSite: noop,
    }),
  );

  const activeIndex = html.indexOf("Active Incident");
  const resolvedIndex = html.indexOf("Resolved Incident");
  assert.ok(activeIndex >= 0);
  assert.ok(resolvedIndex >= 0);
  assert.ok(activeIndex < resolvedIndex);
  assert.ok(html.includes(">Active<"));
  assert.equal(html.includes("Investigating"), false);
});

test("MatchPopupCard renders page suppression action when handler is provided", () => {
  const html = renderToStaticMarkup(
    React.createElement(MatchPopupCard, {
      matches: [
        entry({
          _type: "ProductLine",
          PageID: "pl-airpods",
          PageName: "AirPods",
        }),
      ],
      logoUrl: "/logo.png",
      externalIconUrl: "/open-in-new.svg",
      onSuppressSite: noop,
      onSuppressPageName: noop,
    }),
  );

  assert.ok(html.includes("Hide for this product"));
});

test("MatchPopupCard prefers product-linked company over marketplace company", () => {
  const html = renderToStaticMarkup(
    React.createElement(MatchPopupCard, {
      matches: [
        entry({
          _type: "ProductLine",
          PageID: "pl-airpods",
          PageName: "AirPods",
          Company: "Apple",
        }),
        entry({
          _type: "Company",
          PageID: "company-amazon",
          PageName: "Amazon",
          Description: "Amazon company description",
        }),
        entry({
          _type: "Company",
          PageID: "company-apple",
          PageName: "Apple",
          Description: "Apple company description",
        }),
        entry({
          _type: "Incident",
          PageID: "incident-amazon",
          PageName: "Amazon incident",
          Company: "Amazon",
          Status: "Active",
          StartDate: "2026-01-01",
        }),
        entry({
          _type: "Incident",
          PageID: "incident-apple",
          PageName: "Apple incident",
          Company: "Apple",
          Status: "Active",
          StartDate: "2026-01-01",
        }),
      ],
      logoUrl: "/logo.png",
      externalIconUrl: "/open-in-new.svg",
      onSuppressSite: noop,
    }),
  );

  assert.ok(html.includes("Apple company description"));
  assert.equal(html.includes("Amazon company description"), false);

  const appleIncidentIndex = html.indexOf("Apple incident");
  const amazonIncidentIndex = html.indexOf("Amazon incident");
  assert.ok(appleIncidentIndex >= 0);
  assert.ok(amazonIncidentIndex >= 0);
  assert.ok(appleIncidentIndex < amazonIncidentIndex);
});

test("getIncidentTooltipText returns trimmed description when present", () => {
  assert.equal(
    getIncidentTooltipText(
      entry({
        _type: "Incident",
        PageID: "incident-with-description",
        PageName: "Incident With Description",
        Description: "  Tooltip text  ",
      }),
    ),
    "Tooltip text",
  );
});

test("getIncidentTooltipText returns fallback when description is empty", () => {
  assert.equal(
    getIncidentTooltipText(
      entry({
        _type: "Incident",
        PageID: "incident-without-description",
        PageName: "Incident Without Description",
        Description: "   ",
      }),
    ),
    "No description available.",
  );
});

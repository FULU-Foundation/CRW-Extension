import test from "node:test";
import assert from "node:assert/strict";

import { matchByPageContext, matchByUrl } from "../src/lib/matching/matching.ts";
import { entry, relationFixture } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

test("matchByUrl returns related expanded entries from URL seed matches", () => {
  const dataset = relationFixture();
  const results = matchByUrl(dataset, "https://acme.com/security");
  const ids = results.map((item) => item.PageID);

  assert.ok(ids.includes("company-acme"));
  assert.ok(ids.includes("pl-acme-home"));
  assert.ok(ids.includes("product-acme-cam"));
  assert.ok(ids.includes("incident-acme-breach"));
  assert.ok(!ids.includes("company-other"));
});

const ecommerceFixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
      Website: "https://apple.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-apple-repair",
      PageName: "Apple anti-repair practices",
      Company: "Apple",
      ProductLine: "AirPods",
    }),
  ];
};

test("matchByPageContext matches ecommerce page when meta/title contain entity", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
  assert.ok(ids.includes("incident-apple-repair"));
});

test("matchByPageContext falls back to ecommerce URL alias matches when meta/title have no entity signal", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/random-listing/dp/B000000000",
    hostname: "www.amazon.com.au",
    title: "Premium USB Cable : Amazon.com.au: Electronics",
    meta: {
      description: "Fast charging usb cable bundle",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-amazon"));
  assert.equal(ids.includes("company-apple"), false);
});

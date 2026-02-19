import test from "node:test";
import assert from "node:assert/strict";

import { matchEntriesByPageContext } from "../src/lib/matching/pageContextMatching.ts";
import { entry } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

const fixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
    entry({
      _type: "Product",
      PageID: "product-electron",
      PageName: "Electron",
    }),
  ];
};

test("matches ecommerce entities from title/description", () => {
  const results = matchEntriesByPageContext(fixture(), {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
});

test("does not match by partial substring (Electron vs Electronics)", () => {
  const results = matchEntriesByPageContext(fixture(), {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.equal(ids.includes("product-electron"), false);
});

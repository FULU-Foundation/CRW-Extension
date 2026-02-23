import test from "node:test";
import assert from "node:assert/strict";

import { expandRelatedEntries } from "../src/lib/matching/relations.ts";
import type { CargoEntry } from "../src/shared/types.ts";
import { relationFixture, entry } from "./helpers.ts";

test("expands related entries from a company seed", () => {
  const dataset = relationFixture();
  const seeds = [dataset[0]];

  const expanded = expandRelatedEntries(dataset, seeds);
  const ids = expanded.map((item) => item.PageID);

  assert.ok(ids.includes("company-acme"));
  assert.ok(ids.includes("pl-acme-home"));
  assert.ok(ids.includes("product-acme-cam"));
  assert.ok(ids.includes("incident-acme-breach"));
  assert.ok(!ids.includes("company-other"));
});

test("expands related entries from a product seed", () => {
  const dataset = relationFixture();
  const seeds = [dataset[2]];

  const expanded = expandRelatedEntries(dataset, seeds);
  const ids = expanded.map((item) => item.PageID);

  assert.ok(ids.includes("company-acme"));
  assert.ok(ids.includes("pl-acme-home"));
  assert.ok(ids.includes("product-acme-cam"));
  assert.ok(ids.includes("incident-acme-breach"));
  assert.ok(!ids.includes("company-other"));
});

test("expands related entries from an incident seed", () => {
  const dataset = relationFixture();
  const seeds = [dataset[3]];

  const expanded = expandRelatedEntries(dataset, seeds);
  const ids = expanded.map((item) => item.PageID);

  assert.ok(ids.includes("company-acme"));
  assert.ok(ids.includes("pl-acme-home"));
  assert.ok(ids.includes("product-acme-cam"));
  assert.ok(ids.includes("incident-acme-breach"));
  assert.ok(!ids.includes("company-other"));
});

test("does not chain into unrelated companies through non-seed references", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-bytedance",
      PageName: "ByteDance",
      Website: "https://bytedance.com/",
    }),
    entry({
      _type: "Product",
      PageID: "product-tiktok",
      PageName: "TikTok",
      Company: "ByteDance",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-elsagate",
      PageName: "Elsagate",
      Company: "YouTube, TikTok",
      Product: "YouTube, TikTok",
    }),
    entry({
      _type: "Product",
      PageID: "product-youtube",
      PageName: "YouTube",
      Company: "Google",
    }),
    entry({
      _type: "Company",
      PageID: "company-google",
      PageName: "Google",
      Website: "https://google.com/",
    }),
  ];

  const expanded = expandRelatedEntries(dataset, [dataset[0]]);
  const ids = expanded.map((item) => item.PageID);

  assert.ok(ids.includes("company-bytedance"));
  assert.ok(ids.includes("product-tiktok"));
  assert.ok(ids.includes("incident-elsagate"));
  assert.ok(!ids.includes("product-youtube"));
  assert.ok(!ids.includes("company-google"));
});

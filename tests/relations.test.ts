import test from "node:test";
import assert from "node:assert/strict";

import { expandRelatedEntries } from "../src/lib/matching/relations.ts";
import { relationFixture } from "./helpers.ts";

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

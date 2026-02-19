import test from "node:test";
import assert from "node:assert/strict";

import { matchByUrl } from "../src/lib/matching/matching.ts";
import { relationFixture } from "./helpers.ts";

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

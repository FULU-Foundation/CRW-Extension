import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSnoozedSiteMap } from "../src/shared/snoozedSites.ts";

test("normalizeSnoozedSiteMap returns empty map for non-object input", () => {
  assert.deepEqual(normalizeSnoozedSiteMap(null), {});
  assert.deepEqual(normalizeSnoozedSiteMap(undefined), {});
  assert.deepEqual(normalizeSnoozedSiteMap("string"), {});
  assert.deepEqual(normalizeSnoozedSiteMap(42), {});
});

test("normalizeSnoozedSiteMap migrates old single-object format to array", () => {
  const old = {
    "amazon.com": { incidentSignature: "inc-a|active", snoozedAt: Date.now() },
    "google.com": {
      incidentSignature: "inc-b|resolved",
      snoozedAt: Date.now(),
    },
  };

  const result = normalizeSnoozedSiteMap(old);

  assert.equal(Array.isArray(result["amazon.com"]), true);
  assert.equal(result["amazon.com"].length, 1);
  assert.equal(result["amazon.com"][0].incidentSignature, "inc-a|active");

  assert.equal(Array.isArray(result["google.com"]), true);
  assert.equal(result["google.com"].length, 1);
  assert.equal(result["google.com"][0].incidentSignature, "inc-b|resolved");
});

test("normalizeSnoozedSiteMap preserves new array format", () => {
  const now = Date.now();
  const input = {
    "amazon.com": [
      { incidentSignature: "inc-a|active", snoozedAt: now },
      { incidentSignature: "inc-b|active", snoozedAt: now },
    ],
  };

  const result = normalizeSnoozedSiteMap(input);

  assert.equal(result["amazon.com"].length, 2);
  assert.equal(result["amazon.com"][0].incidentSignature, "inc-a|active");
  assert.equal(result["amazon.com"][1].incidentSignature, "inc-b|active");
});

test("normalizeSnoozedSiteMap normalizes domain keys", () => {
  const now = Date.now();
  const input = {
    "WWW.Example.COM": [
      { incidentSignature: "inc-a|active", snoozedAt: now },
    ],
    "  shop.test.com  ": [
      { incidentSignature: "inc-b|active", snoozedAt: now },
    ],
  };

  const result = normalizeSnoozedSiteMap(input);

  assert.equal(result["example.com"]?.length, 1);
  assert.equal(result["shop.test.com"]?.length, 1);
  assert.equal(result["WWW.Example.COM"], undefined);
});

test("normalizeSnoozedSiteMap prunes entries older than 30 days", () => {
  const now = Date.now();
  const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
  const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;

  const input = {
    "amazon.com": [
      { incidentSignature: "old-sig", snoozedAt: thirtyOneDaysAgo },
      { incidentSignature: "fresh-sig", snoozedAt: oneDayAgo },
    ],
    "stale.com": [
      { incidentSignature: "ancient-sig", snoozedAt: thirtyOneDaysAgo },
    ],
  };

  const result = normalizeSnoozedSiteMap(input);

  assert.equal(result["amazon.com"].length, 1);
  assert.equal(result["amazon.com"][0].incidentSignature, "fresh-sig");
  assert.equal(result["stale.com"], undefined);
});

test("normalizeSnoozedSiteMap skips invalid entries in arrays", () => {
  const now = Date.now();
  const input = {
    "example.com": [
      { incidentSignature: "valid", snoozedAt: now },
      { incidentSignature: 123, snoozedAt: now },
      { bad: "entry" },
      null,
      "string",
      { incidentSignature: "also-valid", snoozedAt: now },
    ],
  };

  const result = normalizeSnoozedSiteMap(input);

  assert.equal(result["example.com"].length, 2);
  assert.equal(result["example.com"][0].incidentSignature, "valid");
  assert.equal(result["example.com"][1].incidentSignature, "also-valid");
});

test("normalizeSnoozedSiteMap merges duplicate normalized domains", () => {
  const now = Date.now();
  const input = {
    "www.example.com": [
      { incidentSignature: "sig-a", snoozedAt: now },
    ],
    "Example.com": [
      { incidentSignature: "sig-b", snoozedAt: now },
    ],
  };

  const result = normalizeSnoozedSiteMap(input);

  assert.equal(result["example.com"].length, 2);
  const sigs = result["example.com"].map((e) => e.incidentSignature).sort();
  assert.deepEqual(sigs, ["sig-a", "sig-b"]);
});

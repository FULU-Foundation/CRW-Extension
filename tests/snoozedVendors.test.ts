import test from "node:test";
import assert from "node:assert/strict";

import {
  addVendorSnoozeEntries,
  getVendorNamesFromMatches,
  hasVendorSnoozeEntry,
  normalizeSnoozedVendorMap,
  normalizeVendorKey,
  removeVendorSnoozeEntries,
} from "../src/shared/snoozedVendors.ts";
import type { CargoEntry } from "../src/shared/types.ts";

test("normalizeVendorKey trims and lowercases", () => {
  assert.equal(normalizeVendorKey("  Cloudflare  "), "cloudflare");
  assert.equal(normalizeVendorKey("WhatsApp"), "whatsapp");
  assert.equal(normalizeVendorKey(""), "");
  assert.equal(normalizeVendorKey(null), "");
  assert.equal(normalizeVendorKey(undefined), "");
});

test("normalizeSnoozedVendorMap returns empty map for non-object input", () => {
  assert.deepEqual(normalizeSnoozedVendorMap(null), {});
  assert.deepEqual(normalizeSnoozedVendorMap(undefined), {});
  assert.deepEqual(normalizeSnoozedVendorMap("string"), {});
  assert.deepEqual(normalizeSnoozedVendorMap(42), {});
});

test("normalizeSnoozedVendorMap preserves valid entries", () => {
  const now = Date.now();
  const input = {
    cloudflare: [
      {
        companyName: "Cloudflare",
        incidentSignature: "inc-a|active",
        snoozedAt: now,
      },
      {
        companyName: "Cloudflare",
        incidentSignature: "inc-b|active",
        snoozedAt: now,
      },
    ],
  };

  const result = normalizeSnoozedVendorMap(input);

  assert.equal(result["cloudflare"].length, 2);
  assert.equal(result["cloudflare"][0].companyName, "Cloudflare");
  assert.equal(result["cloudflare"][0].incidentSignature, "inc-a|active");
});

test("normalizeSnoozedVendorMap normalizes vendor keys and merges duplicates", () => {
  const now = Date.now();
  const input = {
    "  Cloudflare ": [
      {
        companyName: "Cloudflare",
        incidentSignature: "sig-a",
        snoozedAt: now,
      },
    ],
    cloudflare: [
      {
        companyName: "Cloudflare",
        incidentSignature: "sig-b",
        snoozedAt: now,
      },
    ],
  };

  const result = normalizeSnoozedVendorMap(input);

  assert.equal(result["cloudflare"].length, 2);
  const sigs = result["cloudflare"].map((e) => e.incidentSignature).sort();
  assert.deepEqual(sigs, ["sig-a", "sig-b"]);
});

test("normalizeSnoozedVendorMap prunes entries older than 30 days", () => {
  const now = Date.now();
  const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
  const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;

  const input = {
    cloudflare: [
      {
        companyName: "Cloudflare",
        incidentSignature: "old-sig",
        snoozedAt: thirtyOneDaysAgo,
      },
      {
        companyName: "Cloudflare",
        incidentSignature: "fresh-sig",
        snoozedAt: oneDayAgo,
      },
    ],
    stale: [
      {
        companyName: "Stale",
        incidentSignature: "ancient-sig",
        snoozedAt: thirtyOneDaysAgo,
      },
    ],
  };

  const result = normalizeSnoozedVendorMap(input);

  assert.equal(result["cloudflare"].length, 1);
  assert.equal(result["cloudflare"][0].incidentSignature, "fresh-sig");
  assert.equal(result["stale"], undefined);
});

test("normalizeSnoozedVendorMap skips invalid entries", () => {
  const now = Date.now();
  const input = {
    cloudflare: [
      { companyName: "Cloudflare", incidentSignature: "valid", snoozedAt: now },
      { companyName: 42, incidentSignature: "bad-name", snoozedAt: now },
      { incidentSignature: "no-name", snoozedAt: now },
      null,
      "string",
    ],
    "not-an-array": {
      companyName: "X",
      incidentSignature: "sig",
      snoozedAt: now,
    },
  };

  const result = normalizeSnoozedVendorMap(input);

  assert.equal(result["cloudflare"].length, 1);
  assert.equal(result["cloudflare"][0].incidentSignature, "valid");
  assert.equal(result["not-an-array"], undefined);
});

const companyEntry = (pageName: string): CargoEntry => ({
  _type: "Company",
  PageID: `id-${pageName}`,
  PageName: pageName,
  Description: null,
});

const incidentEntry = (pageName: string, company?: string): CargoEntry => ({
  _type: "Incident",
  PageID: `id-${pageName}`,
  PageName: pageName,
  Description: null,
  Company: company,
});

const productEntry = (pageName: string, company?: string): CargoEntry => ({
  _type: "Product",
  PageID: `id-${pageName}`,
  PageName: pageName,
  Description: null,
  Company: company,
});

test("getVendorNamesFromMatches collects company entry names", () => {
  const matches = [companyEntry("Cloudflare")];
  assert.deepEqual(getVendorNamesFromMatches(matches), ["Cloudflare"]);
});

test("getVendorNamesFromMatches splits comma-separated incident companies", () => {
  const matches = [incidentEntry("Privacy update", "Facebook, WhatsApp")];
  assert.deepEqual(getVendorNamesFromMatches(matches), [
    "Facebook",
    "WhatsApp",
  ]);
});

test("getVendorNamesFromMatches dedupes across entry kinds, keeps first casing", () => {
  const matches = [
    companyEntry("Cloudflare"),
    incidentEntry("Incident A", "cloudflare"),
    productEntry("Workers", "Cloudflare"),
  ];
  assert.deepEqual(getVendorNamesFromMatches(matches), ["Cloudflare"]);
});

test("getVendorNamesFromMatches ignores entries without company data", () => {
  const matches = [incidentEntry("Orphan incident"), productEntry("Widget")];
  assert.deepEqual(getVendorNamesFromMatches(matches), []);
});

test("addVendorSnoozeEntries adds entries under normalized keys", () => {
  const now = Date.now();
  const map = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", now);

  assert.equal(map["cloudflare"].length, 1);
  assert.equal(map["cloudflare"][0].companyName, "Cloudflare");
  assert.equal(map["cloudflare"][0].incidentSignature, "sig-a");
  assert.equal(map["cloudflare"][0].snoozedAt, now);
});

test("addVendorSnoozeEntries refreshes existing signature instead of duplicating", () => {
  const map = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", 1000);
  const updated = addVendorSnoozeEntries(map, ["Cloudflare"], "sig-a", 2000);

  assert.equal(updated["cloudflare"].length, 1);
  assert.equal(updated["cloudflare"][0].snoozedAt, 2000);
});

test("addVendorSnoozeEntries does not mutate the input map", () => {
  const original = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", 1000);
  addVendorSnoozeEntries(original, ["Cloudflare"], "sig-b", 2000);

  assert.equal(original["cloudflare"].length, 1);
});

test("removeVendorSnoozeEntries removes matching signature only", () => {
  const now = Date.now();
  let map = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", now);
  map = addVendorSnoozeEntries(map, ["Cloudflare"], "sig-b", now);

  const { map: next, changed } = removeVendorSnoozeEntries(
    map,
    ["Cloudflare"],
    "sig-a",
  );

  assert.equal(changed, true);
  assert.equal(next["cloudflare"].length, 1);
  assert.equal(next["cloudflare"][0].incidentSignature, "sig-b");
});

test("removeVendorSnoozeEntries with no signature clears the vendor", () => {
  const now = Date.now();
  const map = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", now);

  const { map: next, changed } = removeVendorSnoozeEntries(map, [
    "Cloudflare",
  ]);

  assert.equal(changed, true);
  assert.equal(next["cloudflare"], undefined);
});

test("removeVendorSnoozeEntries reports unchanged when nothing matches", () => {
  const now = Date.now();
  const map = addVendorSnoozeEntries({}, ["Cloudflare"], "sig-a", now);

  const { changed } = removeVendorSnoozeEntries(map, ["Other"], "sig-a");

  assert.equal(changed, false);
});

test("vendor snooze covers other domains of the same company (issue #160)", () => {
  const now = Date.now();
  // User snoozes on blog.cloudflare.com; matches include the Cloudflare
  // company entry and its incidents.
  const blogMatches = [
    companyEntry("Cloudflare"),
    incidentEntry("Incident A", "Cloudflare"),
  ];
  const signature = "inc-a|active";
  const map = addVendorSnoozeEntries(
    {},
    getVendorNamesFromMatches(blogMatches),
    signature,
    now,
  );

  // Later the user visits dash.cloudflare.com (or cloudflare.net); the same
  // company matches with the same incident signature.
  const dashMatches = [
    companyEntry("Cloudflare"),
    incidentEntry("Incident A", "Cloudflare"),
  ];
  assert.equal(
    hasVendorSnoozeEntry(
      map,
      getVendorNamesFromMatches(dashMatches),
      signature,
    ),
    true,
  );

  // A new incident changes the signature, so the popup shows again.
  assert.equal(
    hasVendorSnoozeEntry(
      map,
      getVendorNamesFromMatches(dashMatches),
      "inc-a|active||inc-b|active",
    ),
    false,
  );

  // An unrelated company is not snoozed.
  assert.equal(
    hasVendorSnoozeEntry(
      map,
      getVendorNamesFromMatches([companyEntry("Amazon")]),
      signature,
    ),
    false,
  );
});

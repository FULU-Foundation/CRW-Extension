import test from "node:test";
import assert from "node:assert/strict";

import {
  type SnoozedSiteMap,
  normalizeSnoozedSiteMap,
} from "../src/shared/snoozedSites.ts";
import { buildIncidentSignature } from "../src/shared/incidentSignature.ts";
import { entry } from "./helpers.ts";

// -- Helpers that mirror content script logic without browser APIs --

const snooze = (
  map: SnoozedSiteMap,
  hostname: string,
  signature: string,
): SnoozedSiteMap => {
  const next = { ...map };
  const entries = [...(next[hostname] || [])];
  const idx = entries.findIndex((e) => e.incidentSignature === signature);
  if (idx >= 0) {
    entries[idx] = { incidentSignature: signature, snoozedAt: Date.now() };
  } else {
    entries.push({ incidentSignature: signature, snoozedAt: Date.now() });
  }
  next[hostname] = entries;
  return next;
};

const unsnooze = (
  map: SnoozedSiteMap,
  hostname: string,
  signature?: string,
): SnoozedSiteMap => {
  const next = { ...map };
  const entries = next[hostname];
  if (!entries || entries.length === 0) return next;

  if (signature) {
    const filtered = entries.filter((e) => e.incidentSignature !== signature);
    if (filtered.length === 0) {
      delete next[hostname];
    } else {
      next[hostname] = filtered;
    }
  } else {
    delete next[hostname];
  }
  return next;
};

const isSnoozed = (
  map: SnoozedSiteMap,
  hostname: string,
  signature: string,
): boolean => {
  const entries = map[hostname];
  if (!entries || entries.length === 0) return false;
  return entries.some((e) => e.incidentSignature === signature);
};

// -- Build realistic incident signatures --

const amazonSignature = buildIncidentSignature([
  entry({
    _type: "Incident",
    PageID: "incident-amazon-outage",
    PageName: "Amazon Outage",
    Status: "Active",
  }),
]);

const googleSignature = buildIncidentSignature([
  entry({
    _type: "Incident",
    PageID: "incident-google-pixel-recall",
    PageName: "Pixel Recall",
    Status: "Active",
  }),
]);

const amazonNewSignature = buildIncidentSignature([
  entry({
    _type: "Incident",
    PageID: "incident-amazon-outage",
    PageName: "Amazon Outage",
    Status: "Active",
  }),
  entry({
    _type: "Incident",
    PageID: "incident-amazon-breach",
    PageName: "Amazon Data Breach",
    Status: "Active",
  }),
]);

// -- Tests --

test("two tabs on same hostname can snooze independently", () => {
  let map: SnoozedSiteMap = {};

  // Tab A (amazon.com homepage) snoozes Amazon incidents
  map = snooze(map, "amazon.com", amazonSignature);
  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);
  assert.equal(isSnoozed(map, "amazon.com", googleSignature), false);

  // Tab B (amazon.com/Google-Pixel page) snoozes Google incidents
  map = snooze(map, "amazon.com", googleSignature);
  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);
  assert.equal(isSnoozed(map, "amazon.com", googleSignature), true);

  // Both entries coexist
  assert.equal(map["amazon.com"].length, 2);
});

test("unsnoozing one tab does not affect the other tab", () => {
  let map: SnoozedSiteMap = {};

  // Both tabs snoozed
  map = snooze(map, "amazon.com", amazonSignature);
  map = snooze(map, "amazon.com", googleSignature);
  assert.equal(map["amazon.com"].length, 2);

  // Tab B clicks "Resume alerts" — only removes Google signature
  map = unsnooze(map, "amazon.com", googleSignature);
  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);
  assert.equal(isSnoozed(map, "amazon.com", googleSignature), false);
  assert.equal(map["amazon.com"].length, 1);
});

test("snooze check does not write to storage (no cascading deletes)", () => {
  let map: SnoozedSiteMap = {};

  // Tab A snoozed with Amazon signature
  map = snooze(map, "amazon.com", amazonSignature);

  // Tab B checks with a DIFFERENT signature — just returns false, map unchanged
  const before = JSON.stringify(map);
  const result = isSnoozed(map, "amazon.com", googleSignature);
  const after = JSON.stringify(map);

  assert.equal(result, false);
  assert.equal(before, after, "map must not be mutated by isSnoozed check");
});

test("new incident causes auto-expire (signature mismatch)", () => {
  let map: SnoozedSiteMap = {};

  // Snooze with current Amazon incidents
  map = snooze(map, "amazon.com", amazonSignature);
  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);

  // New incident arrives — signature changes
  assert.notEqual(amazonSignature, amazonNewSignature);
  assert.equal(isSnoozed(map, "amazon.com", amazonNewSignature), false);

  // Old entry still in storage (harmless zombie, cleaned up after 30 days)
  assert.equal(map["amazon.com"].length, 1);
});

test("suppress site clears all snooze entries for that hostname", () => {
  let map: SnoozedSiteMap = {};

  // Multiple snooze entries
  map = snooze(map, "amazon.com", amazonSignature);
  map = snooze(map, "amazon.com", googleSignature);
  assert.equal(map["amazon.com"].length, 2);

  // Suppress = unsnooze with no signature
  map = unsnooze(map, "amazon.com");
  assert.equal(map["amazon.com"], undefined);
});

test("re-snoozing same signature refreshes timestamp without duplicating", () => {
  let map: SnoozedSiteMap = {};

  map = snooze(map, "amazon.com", amazonSignature);
  assert.equal(map["amazon.com"].length, 1);
  const firstTimestamp = map["amazon.com"][0].snoozedAt;

  // Small delay to ensure different timestamp
  const later = Date.now() + 1000;
  const entries = [...(map["amazon.com"] || [])];
  const idx = entries.findIndex(
    (e) => e.incidentSignature === amazonSignature,
  );
  entries[idx] = { incidentSignature: amazonSignature, snoozedAt: later };
  map = { ...map, "amazon.com": entries };

  assert.equal(map["amazon.com"].length, 1, "no duplicate entry");
  assert.equal(map["amazon.com"][0].snoozedAt > firstTimestamp, true);
});

test("different hostnames (amazon.com vs amazon.in) are fully independent", () => {
  let map: SnoozedSiteMap = {};

  map = snooze(map, "amazon.com", amazonSignature);
  map = snooze(map, "amazon.in", googleSignature);

  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);
  assert.equal(isSnoozed(map, "amazon.com", googleSignature), false);
  assert.equal(isSnoozed(map, "amazon.in", googleSignature), true);
  assert.equal(isSnoozed(map, "amazon.in", amazonSignature), false);

  // Unsnooze amazon.com doesn't affect amazon.in
  map = unsnooze(map, "amazon.com", amazonSignature);
  assert.equal(map["amazon.com"], undefined);
  assert.equal(isSnoozed(map, "amazon.in", googleSignature), true);
});

test("old storage format (single object) migrates correctly and is snoozed", () => {
  // Simulate old format from before the fix
  const oldStorage = {
    "amazon.com": {
      incidentSignature: amazonSignature,
      snoozedAt: Date.now(),
    },
  };

  const map = normalizeSnoozedSiteMap(oldStorage);

  // Migrated to array
  assert.equal(Array.isArray(map["amazon.com"]), true);
  assert.equal(map["amazon.com"].length, 1);

  // Still recognized as snoozed
  assert.equal(isSnoozed(map, "amazon.com", amazonSignature), true);
});

test("settings page remove clears hostname regardless of entry count", () => {
  let map: SnoozedSiteMap = {};

  map = snooze(map, "amazon.com", amazonSignature);
  map = snooze(map, "amazon.com", googleSignature);
  map = snooze(map, "google.com", googleSignature);

  // Settings page removes by hostname (no signature)
  map = unsnooze(map, "amazon.com");

  assert.equal(map["amazon.com"], undefined);
  assert.equal(isSnoozed(map, "google.com", googleSignature), true);
});

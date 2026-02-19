import test from "node:test";
import assert from "node:assert/strict";

import type { CargoEntry } from "../src/shared/types.ts";
import {
  classifyUrlMatch,
  matchEntriesByUrl,
  safeParseUrl,
  scoreUrlMatch,
} from "../src/lib/matching/urlMatching.ts";
import { entry } from "./helpers.ts";

test("classifies exact match when host and normalized path are equal", () => {
  const visited = safeParseUrl("https://www.ally.com/invest/");
  const candidate = safeParseUrl("https://www.ally.com/invest");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "exact");
});

test("classifies partial when visited path is a deeper prefix on same host", () => {
  const visited = safeParseUrl("https://www.ally.com/invest/hello");
  const candidate = safeParseUrl("https://www.ally.com/invest/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "partial");
  assert.equal(result.matchedPath, "/invest");
});

test("does not partial-match when candidate is deeper than visited path", () => {
  const visited = safeParseUrl("https://www.ally.com/invest/hello");
  const candidate = safeParseUrl(
    "https://www.ally.com/invest/robo-automated-investing/",
  );
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("classifies subdomain match without requiring path compatibility", () => {
  const visited = safeParseUrl("https://invest.ally.com/ola/");
  const candidate = safeParseUrl("https://www.ally.com/invest/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
});

test("returns null when domains are unrelated", () => {
  const visited = safeParseUrl("https://example.com/path");
  const candidate = safeParseUrl("https://ally.com/invest/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("scores partial matches by prefix length", () => {
  const shortScore = scoreUrlMatch({
    matchType: "partial",
    matchedPath: "/invest",
    visitedHost: "www.ally.com",
    candidateHost: "www.ally.com",
  });
  const longScore = scoreUrlMatch({
    matchType: "partial",
    matchedPath: "/invest/robo",
    visitedHost: "www.ally.com",
    candidateHost: "www.ally.com",
  });

  assert.ok(longScore > shortScore);
});

test("ranks exact above partial above subdomain", () => {
  const dataset: CargoEntry[] = [
    entry({
      PageID: "ally-subdomain",
      PageName: "Ally Root",
      Website: "https://ally.com/",
    }),
    entry({
      PageID: "ally-partial",
      PageName: "Ally Invest",
      Website: "https://www.ally.com/invest/",
    }),
    entry({
      PageID: "ally-exact",
      PageName: "Ally Invest Hello",
      Website: "https://www.ally.com/invest/hello",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://www.ally.com/invest/hello",
    10,
  );
  assert.equal(results.length, 3);
  assert.equal(results[0].matchType, "exact");
  assert.equal(results[1].matchType, "partial");
  assert.equal(results[2].matchType, "subdomain");
});

test("returns empty array for invalid visited URL", () => {
  const results = matchEntriesByUrl([], "not a valid URL", 10);
  assert.deepEqual(results, []);
});

test("classifies ecommerce international domains as alias matches", () => {
  const visited = safeParseUrl("https://www.amazon.com.au/s?k=airpods");
  const candidate = safeParseUrl("https://amazon.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
});

test("matches amazon.com cargo entries while browsing amazon.com.au", () => {
  const dataset: CargoEntry[] = [
    entry({
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com/",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    10,
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.PageID, "company-amazon");
  assert.equal(results[0].matchType, "subdomain");
});

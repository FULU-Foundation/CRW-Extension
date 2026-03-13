import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import type { CargoEntry } from "../src/shared/types.ts";
import {
  classifyUrlMatch,
  matchEntriesByUrl,
  safeParseUrl,
  scoreUrlMatch,
} from "../src/lib/matching/urlMatching.ts";
import {
  resetMatchingConfig,
  setMatchingConfig,
} from "../src/lib/matching/matchingConfig.ts";
import { entry } from "./helpers.ts";

afterEach(() => {
  resetMatchingConfig();
});

test("classifies exact match when host and normalized path are equal", () => {
  const visited = safeParseUrl("https://www.ally.com/invest/");
  const candidate = safeParseUrl("https://www.ally.com/invest");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "exact");
});

test("preserves path case", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Product",
      PageID: "thunderbird",
      PageName: "Thunderbird",
      Website: "https://www.thunderbird.net/en-US/",
    }),
  ];

  const exactResults = matchEntriesByUrl(
    dataset,
    "https://www.thunderbird.net/en-US/",
    10,
  );
  const lowercasedResults = matchEntriesByUrl(
    dataset,
    "https://www.thunderbird.net/en-us/",
    10,
  );

  assert.equal(exactResults.length, 1);
  assert.equal(exactResults[0]?.matchType, "exact");
  assert.equal(lowercasedResults.length, 0);
});

test("treats www and bare domains as equal hosts", () => {
  const visited = safeParseUrl(
    "https://www.7-eleven.com/7rewards/7-eleven-wallet",
  );
  const candidate = safeParseUrl("https://7-eleven.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "partial");
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
  setMatchingConfig({ enableSubdomainMatching: true });
  const visited = safeParseUrl("https://invest.ally.com/ola/");
  const candidate = safeParseUrl("https://www.ally.com/invest/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
});

test("does not classify subdomain match when subdomain matching is disabled", () => {
  setMatchingConfig({ enableSubdomainMatching: false });
  const visited = safeParseUrl("https://invest.ally.com/ola/");
  const candidate = safeParseUrl("https://www.ally.com/invest/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not classify cross-TLD alias match when enableMatchAcrossTLDs is disabled", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: false,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://www.dyson.co.uk/");
  const candidate = safeParseUrl("https://www.dyson.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("classifies cross-TLD alias match when enableMatchAcrossTLDs is enabled", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://www.dyson.com.au/");
  const candidate = safeParseUrl("https://www.dyson.co.uk/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
  assert.equal(result.crossTldAlias, true);
});

test("classifies dyson.co.uk and dyson.com as cross-TLD aliases when enabled", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://www.dyson.co.uk/");
  const candidate = safeParseUrl("https://www.dyson.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
  assert.equal(result.crossTldAlias, true);
});

test("classifies cross-match ccTLD to .com host", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://www.ford.ca/");
  const candidate = safeParseUrl("https://www.ford.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
  assert.equal(result.crossTldAlias, true);
});

test("classifies cross-match ccTLD to other ccTLD", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://www.ford.ca/");
  const candidate = safeParseUrl("https://www.ford.fr/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.ok(result);
  assert.equal(result.matchType, "subdomain");
  assert.equal(result.crossTldAlias, true);
});


test("does not cross-match generic TLD sites to ccTLDs", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://ford.anythingatall/");
  const candidate = safeParseUrl("https://ford.com");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not cross-match unrelated brand TLD hosts sharing generic label", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://global.honda/");
  const candidate = safeParseUrl("https://global.canon/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not bridge brand/generic TLD pairs without compound suffix or country code evidence", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://global.brother/");
  const candidate = safeParseUrl("https://www.brother.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not cross-match custom TLD host to brand .com without compound suffix or country code evidence", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://global.canon/");
  const candidate = safeParseUrl("https://www.canon.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not cross-match generic .live TLD sites to yubo.live", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://live.com/");
  const candidate = safeParseUrl("https://yubo.live/en");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not cross-match yubo.live to live.com in reverse direction", () => {
  setMatchingConfig({
    enableMatchAcrossTLDs: true,
    enableSubdomainMatching: true,
  });
  const visited = safeParseUrl("https://yubo.live/en");
  const candidate = safeParseUrl("https://live.com/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("does not classify unrelated .com.au domains as subdomain matches", () => {
  setMatchingConfig({ enableSubdomainMatching: true });
  const visited = safeParseUrl("https://optus.com.au/");
  const candidate = safeParseUrl("https://www.qantas.com.au/");
  assert.ok(visited);
  assert.ok(candidate);

  const result = classifyUrlMatch(visited, candidate);
  assert.equal(result, null);
});

test("classifies .co.uk subdomains using registrable domain", () => {
  setMatchingConfig({ enableSubdomainMatching: true });
  const visited = safeParseUrl("https://support.bbc.co.uk/help");
  const candidate = safeParseUrl("https://www.bbc.co.uk/");
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

test("ranks exact above partial above subdomain for non-github hosts", () => {
  setMatchingConfig({ enableSubdomainMatching: true });
  const dataset: CargoEntry[] = [
    entry({
      PageID: "ally-subdomain",
      PageName: "Ally Root",
      Website: "https://support.ally.com/",
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

test("prefers root domain entries over deeper subdomains when scores tie", () => {
  setMatchingConfig({ enableSubdomainMatching: true });

  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-fitbit",
      PageName: "Fitbit",
      Website: "https://store.google.com/category/watches_trackers",
    }),
    entry({
      _type: "Company",
      PageID: "company-google",
      PageName: "Google",
      Website: "https://www.google.com/",
    }),
    entry({
      _type: "Product",
      PageID: "product-google-support",
      PageName: "Google Support",
      Website: "https://support.google.com/",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://messages.google.com/",
    10,
  );

  assert.equal(results.length, 3);
  assert.equal(results[0].entry.PageID, "company-google");
  assert.equal(results[0].matchType, "subdomain");
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

test("matches entries with comma-separated Website URLs", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "alliance-laundry",
      PageName: "Alliance Laundry Solutions and Speed Queen",
      Website: "https://alliancelaundry.com/,https://speedqueencommercial.com",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://speedqueencommercial.com/",
    10,
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.PageID, "alliance-laundry");
  assert.equal(results[0].matchType, "exact");
});

test("matches entries with space-separated Website URLs", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "alliance-laundry",
      PageName: "Alliance Laundry Solutions and Speed Queen",
      Website: "https://alliancelaundry.com/ https://speedqueencommercial.com",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://speedqueencommercial.com/",
    10,
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.PageID, "alliance-laundry");
  assert.equal(results[0].matchType, "exact");
});

test("matches mediawiki external-link website values when label contains canonical URL", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "ProductLine",
      PageID: "redbox",
      PageName: "Redbox",
      Website:
        "[https://web.archive.org/web/20241001080426/https://www.redbox.com/ https://www.redbox.com/]",
    }),
  ];

  const results = matchEntriesByUrl(dataset, "https://www.redbox.com/", 10);

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.PageID, "redbox");
});

test("prefers repo-specific github entry over github root company entry", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-github",
      PageName: "GitHub",
      Website: "github.com",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-crw-extension",
      PageName: "Consumer Rights Wiki Extension",
      Website: "https://github.com/FULU-Foundation/CRW-Extension/",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://github.com/FULU-Foundation/CRW-Extension/",
    10,
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.PageID, "pl-crw-extension");
  assert.equal(results[0].matchType, "exact");
});

test("does not suppress github root match when domain is not configured", () => {
  setMatchingConfig({ specificPathDomainMatches: [] });
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-github",
      PageName: "GitHub",
      Website: "github.com",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-crw-extension",
      PageName: "Consumer Rights Wiki Extension",
      Website: "https://github.com/FULU-Foundation/CRW-Extension/",
    }),
  ];

  const results = matchEntriesByUrl(
    dataset,
    "https://github.com/FULU-Foundation/CRW-Extension/",
    10,
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].entry.PageID, "pl-crw-extension");
  assert.equal(results[1].entry.PageID, "company-github");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeSiteScopeList,
  getSiteScopeHostname,
  hostnameMatchesSiteScope,
  isHostnameInSiteScopeList,
  normalizeSiteScopeList,
  removeMatchingSiteScopes,
} from "../src/shared/siteScope.ts";

test("getSiteScopeHostname collapses subdomains to the registrable domain", () => {
  assert.equal(getSiteScopeHostname("support.google.com"), "google.com");
  assert.equal(getSiteScopeHostname("www.bbc.co.uk"), "bbc.co.uk");
  assert.equal(getSiteScopeHostname("localhost"), "localhost");
});

test("hostnameMatchesSiteScope includes subdomains but not sibling lookalikes", () => {
  assert.equal(hostnameMatchesSiteScope("example.com", "example.com"), true);
  assert.equal(
    hostnameMatchesSiteScope("support.example.com", "example.com"),
    true,
  );
  assert.equal(
    hostnameMatchesSiteScope("badexample.com", "example.com"),
    false,
  );
});

test("isHostnameInSiteScopeList recognizes matching parent domains", () => {
  assert.equal(
    isHostnameInSiteScopeList("shop.example.com", ["example.com"]),
    true,
  );
  assert.equal(
    isHostnameInSiteScopeList("shop.example.com", ["example.org"]),
    false,
  );
});

test("normalizeSiteScopeList strips www, blanks, and duplicates", () => {
  assert.deepEqual(
    normalizeSiteScopeList([
      "www.example.com",
      "example.com",
      "",
      " Example.com ",
    ]),
    ["example.com"],
  );
});

test("canonicalizeSiteScopeList upgrades hostnames to site scopes", () => {
  assert.deepEqual(
    canonicalizeSiteScopeList([
      "support.example.com",
      "www.example.com",
      "news.bbc.co.uk",
      "localhost",
    ]),
    ["example.com", "bbc.co.uk", "localhost"],
  );
});

test("removeMatchingSiteScopes removes the stored scope that suppresses the current host", () => {
  assert.deepEqual(
    removeMatchingSiteScopes(
      ["example.com", "support.example.com", "example.org"],
      "shop.example.com",
    ),
    ["example.org"],
  );
});

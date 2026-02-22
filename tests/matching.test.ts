import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { matchByPageContext, matchByUrl } from "../src/lib/matching/matching.ts";
import {
  resetMatchingConfig,
} from "../src/lib/matching/matchingConfig.ts";
import { entry, relationFixture } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

afterEach(() => {
  resetMatchingConfig();
});

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

const ecommerceFixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
      Website: "https://apple.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-apple-repair",
      PageName: "Apple anti-repair practices",
      Company: "Apple",
      ProductLine: "AirPods",
    }),
  ];
};

test("matchByPageContext matches ecommerce page when meta/title contain entity", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
  assert.ok(ids.includes("incident-apple-repair"));
});

test("matchByPageContext falls back to ecommerce URL alias matches when meta/title have no entity signal", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/random-listing/dp/B000000000",
    hostname: "www.amazon.com.au",
    title: "Premium USB Cable : Amazon.com.au: Electronics",
    meta: {
      description: "Fast charging usb cable bundle",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-amazon"));
  assert.equal(ids.includes("company-apple"), false);
});

test("matchByPageContext does not run meta-only matches without URL/domain seed", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://example.org/products/airpods",
    hostname: "example.org",
    title: "Apple AirPods 4 review",
    meta: {
      description: "Apple AirPods 4 review",
      "og:title": "Apple AirPods 4 review",
      "og:description": "Apple AirPods 4 review",
    },
  });

  assert.equal(results.length, 0);
});

test("matchByPageContext allows meta-only matching on ecommerce hosts without URL seed", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.ebay.com/itm/1566543210",
    hostname: "www.ebay.com",
    title: "Apple AirPods 4 Wireless Earbuds - White | eBay",
    meta: {
      description: "Shop Apple AirPods 4 at eBay",
      "og:title": "Apple AirPods 4 Wireless Earbuds",
      "og:description": "Buy Apple AirPods on eBay",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("pl-airpods"));
  assert.ok(ids.includes("company-apple"));
});

test("matchByPageContext prioritizes exact non-company URL match before company meta hits", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-7eleven",
      PageName: "7-Eleven",
      Website: "https://7-eleven.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-wallet",
      PageName: "Wallet",
      Company: "7-Eleven",
      Website: "https://www.7-eleven.com/7rewards/7-eleven-wallet",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.7-eleven.com/7rewards/7-eleven-wallet",
    hostname: "www.7-eleven.com",
    title: "7-Eleven Wallet",
    meta: {
      description: "Pay with 7-Eleven Wallet",
      "og:title": "7-Eleven Wallet",
      "og:description": "7-Eleven Wallet",
    },
  });

  assert.equal(results[0]?.PageID, "pl-wallet");
});

test("matchByPageContext promotes wallet meta match when URL seed is company", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-7eleven",
      PageName: "7-Eleven",
      Website: "https://7-eleven.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-wallet",
      PageName: "Wallet",
      Company: "7-Eleven",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.7-eleven.com/7rewards",
    hostname: "www.7-eleven.com",
    title: "7-Eleven Wallet",
    meta: {
      description: "Use your 7-Eleven Wallet in 7REWARDS",
      "og:title": "7-Eleven Wallet",
      "og:description": "Use your 7-Eleven Wallet",
    },
  });

  assert.equal(results[0]?.PageID, "pl-wallet");
});

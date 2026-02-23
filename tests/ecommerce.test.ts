import test from "node:test";
import assert from "node:assert/strict";

import {
  ECOMMERCE_DOMAINS,
  isKnownEcommerceHost,
} from "../src/lib/matching/ecommerce.ts";

test("includes core international Amazon and eBay domains", () => {
  assert.ok(ECOMMERCE_DOMAINS.includes("amazon.com"));
  assert.ok(ECOMMERCE_DOMAINS.includes("amazon.co.uk"));
  assert.ok(ECOMMERCE_DOMAINS.includes("amazon.co.jp"));
  assert.ok(ECOMMERCE_DOMAINS.includes("ebay.com"));
  assert.ok(ECOMMERCE_DOMAINS.includes("ebay.de"));
  assert.ok(ECOMMERCE_DOMAINS.includes("ebay.com.au"));
});

test("detects known ecommerce hosts across Amazon and eBay", () => {
  assert.equal(isKnownEcommerceHost("amazon.com"), true);
  assert.equal(isKnownEcommerceHost("smile.amazon.co.uk"), true);
  assert.equal(isKnownEcommerceHost("www.amazon.in"), true);
  assert.equal(isKnownEcommerceHost("ebay.com"), true);
  assert.equal(isKnownEcommerceHost("m.ebay.com.au"), true);
  assert.equal(isKnownEcommerceHost("checkout.ebay.co.uk"), true);
  assert.equal(isKnownEcommerceHost("shop.example.com"), false);
});

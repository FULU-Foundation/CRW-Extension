import test from "node:test";
import assert from "node:assert/strict";

import { createUrlChangeDetector } from "../src/content/urlChangeDetector.ts";

test("detects a URL change only once", () => {
  const hasUrlChanged = createUrlChangeDetector("https://example.com/first");

  assert.equal(hasUrlChanged("https://example.com/first"), false);
  assert.equal(hasUrlChanged("https://example.com/second"), true);
  assert.equal(hasUrlChanged("https://example.com/second"), false);
});

test("detects path, query, and hash changes", () => {
  const hasUrlChanged = createUrlChangeDetector("https://example.com/");

  assert.equal(hasUrlChanged("https://example.com/product"), true);
  assert.equal(hasUrlChanged("https://example.com/product?id=1"), true);
  assert.equal(hasUrlChanged("https://example.com/product?id=1#details"), true);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  clearObsoleteLocalCaches,
  clearTabMatches,
  readTabMatchReferences,
  resolveTabMatchReferences,
  writeTabMatchReferences,
} from "../src/shared/tabMatchCache.ts";
import { entry } from "./helpers.ts";

class MemoryStorageArea {
  constructor(public values: Record<string, unknown> = {}) {}

  async get(
    keys?: null | string | string[] | Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (keys == null) return { ...this.values };
    if (typeof keys === "string") {
      return keys in this.values ? { [keys]: this.values[keys] } : {};
    }

    const requestedKeys = Array.isArray(keys) ? keys : Object.keys(keys);
    return Object.fromEntries(
      requestedKeys
        .filter((key) => key in this.values)
        .map((key) => [key, this.values[key]]),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.values, items);
  }

  async remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      delete this.values[key];
    }
  }
}

test("upgrade cleanup removes accumulated and legacy caches only", async () => {
  const storage = new MemoryStorageArea({
    crw_matched_12: [{ PageID: "stale" }],
    crw_matched_99: [],
    crw_raw: { Company: [] },
    crw_all: [{ PageID: "legacy" }],
    crw_dataset_cache: { version: 1 },
    crw_warnings_enabled: false,
    unrelated: "preserved",
  });

  await clearObsoleteLocalCaches(storage);

  assert.deepEqual(storage.values, {
    crw_dataset_cache: { version: 1 },
    crw_warnings_enabled: false,
    unrelated: "preserved",
  });
});

test("tab cache stores only compact match references", async () => {
  const storage = new MemoryStorageArea();
  const matches = [
    entry({
      _type: "Company",
      PageID: "acme",
      PageName: "Acme",
      Description: "Not duplicated in the tab cache",
      Website: "https://acme.example",
    }),
  ];

  await writeTabMatchReferences(storage, 42, matches);

  assert.deepEqual(storage.values, {
    crw_matched_42: [{ type: "Company", pageId: "acme" }],
  });
  assert.deepEqual(await readTabMatchReferences(storage, 42), [
    { type: "Company", pageId: "acme" },
  ]);
});

test("resolves references by type and PageID", () => {
  const product = entry({
    _type: "Product",
    PageID: "4725",
    PageName: "Product 4725",
  });
  const productLine = entry({
    _type: "ProductLine",
    PageID: "4725",
    PageName: "Product line 4725",
  });

  assert.deepEqual(
    resolveTabMatchReferences(
      [{ type: "ProductLine", pageId: "4725" }],
      [product, productLine],
    ),
    [productLine],
  );
});

test("ignores invalid and stale match references", async () => {
  const storage = new MemoryStorageArea({
    crw_matched_42: [
      { type: "Company", pageId: "acme" },
      { type: "Unknown", pageId: "invalid" },
      { type: "Product", pageId: 123 },
    ],
  });

  const references = await readTabMatchReferences(storage, 42);
  assert.deepEqual(references, [{ type: "Company", pageId: "acme" }]);
  assert.deepEqual(resolveTabMatchReferences(references, []), []);
});

test("empty match results do not occupy cache space", async () => {
  const storage = new MemoryStorageArea({
    crw_matched_42: [entry({ PageID: "old", PageName: "Old" })],
  });

  await writeTabMatchReferences(storage, 42, []);

  assert.deepEqual(storage.values, {});
  assert.deepEqual(await readTabMatchReferences(storage, 42), []);
});

test("session cleanup removes only tab match entries", async () => {
  const storage = new MemoryStorageArea({
    crw_matched_1: [],
    crw_matched_2: [],
    future_session_value: true,
  });

  await clearTabMatches(storage);

  assert.deepEqual(storage.values, { future_session_value: true });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  clearObsoleteLocalCaches,
  clearTabMatches,
  readTabMatches,
  writeTabMatches,
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

test("tab matches round-trip through a session storage area", async () => {
  const storage = new MemoryStorageArea();
  const matches = [entry({ PageID: "acme", PageName: "Acme" })];

  await writeTabMatches(storage, 42, matches);

  assert.deepEqual(await readTabMatches(storage, 42), matches);
});

test("empty match results do not occupy cache space", async () => {
  const storage = new MemoryStorageArea({
    crw_matched_42: [entry({ PageID: "old", PageName: "Old" })],
  });

  await writeTabMatches(storage, 42, []);

  assert.deepEqual(storage.values, {});
  assert.deepEqual(await readTabMatches(storage, 42), []);
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

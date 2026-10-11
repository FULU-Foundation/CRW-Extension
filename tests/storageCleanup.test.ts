import assert from "node:assert/strict";
import test from "node:test";

import { clearObsoleteLocalCaches } from "../src/shared/storageCleanup.ts";

class MemoryStorageArea {
  constructor(public values: Record<string, unknown> = {}) {}

  async get(): Promise<Record<string, unknown>> {
    return { ...this.values };
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

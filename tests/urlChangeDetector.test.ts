import test from "node:test";
import assert from "node:assert/strict";

import {
  createUrlChangeDebouncer,
  createUrlChangeDetector,
} from "../src/content/urlChangeDetector.ts";

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

test("debounces mutations while a URL refresh is pending", () => {
  let nextTimer = 0;
  let refreshCount = 0;
  const timers = new Map<number, () => void>();
  const clearedTimers: number[] = [];
  const scheduleRefresh = createUrlChangeDebouncer({
    initialUrl: "https://example.com/first",
    delayMs: 300,
    onRefresh: () => {
      refreshCount += 1;
    },
    setTimer: (callback) => {
      nextTimer += 1;
      timers.set(nextTimer, callback);
      return nextTimer;
    },
    clearTimer: (timer) => {
      clearedTimers.push(timer);
      timers.delete(timer);
    },
  });

  scheduleRefresh("https://example.com/second");
  scheduleRefresh("https://example.com/second");

  assert.deepEqual(clearedTimers, [1]);
  assert.equal(timers.has(1), false);
  assert.equal(timers.has(2), true);

  const pendingCallback = timers.get(2);
  timers.delete(2);
  pendingCallback?.();
  assert.equal(refreshCount, 1);

  scheduleRefresh("https://example.com/second");
  assert.equal(timers.size, 0);
});

test("notifies immediately when a new URL is detected", () => {
  let changeCount = 0;
  const scheduleRefresh = createUrlChangeDebouncer({
    initialUrl: "https://example.com/first",
    delayMs: 300,
    onUrlChange: () => {
      changeCount += 1;
    },
    onRefresh: () => undefined,
    setTimer: () => 1,
    clearTimer: () => undefined,
  });

  scheduleRefresh("https://example.com/second");
  scheduleRefresh("https://example.com/second");

  assert.equal(changeCount, 1);
});

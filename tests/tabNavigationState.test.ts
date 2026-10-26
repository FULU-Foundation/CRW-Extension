import assert from "node:assert/strict";
import test from "node:test";

import {
  isCurrentPageUrl,
  TabNavigationState,
} from "../src/background/tabNavigationState.ts";

test("navigation invalidates page work that was already in flight", async () => {
  const state = new TabNavigationState();
  const generation = state.capture(7);
  let finishDatasetLoad: (() => void) | undefined;
  const datasetLoad = new Promise<void>((resolve) => {
    finishDatasetLoad = resolve;
  });

  const canCommit = (async () => {
    await datasetLoad;
    return state.isCurrent(7, generation);
  })();

  state.beginNavigation(7);
  finishDatasetLoad?.();

  assert.equal(await canCommit, false);
});

test("page work is accepted only when its URL is still active", () => {
  assert.equal(
    isCurrentPageUrl("https://example.com/a", "https://example.com/a"),
    true,
  );
  assert.equal(
    isCurrentPageUrl("https://example.com/a", "https://example.com/b"),
    false,
  );
  assert.equal(isCurrentPageUrl("https://example.com/a", undefined), false);
});

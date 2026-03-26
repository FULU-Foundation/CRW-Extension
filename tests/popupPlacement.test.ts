import test from "node:test";
import assert from "node:assert/strict";

import {
  getInlinePopupPlacementStyle,
  shouldPlacePopupAtBottom,
} from "../src/content/popupPlacement.ts";

test("popup stays top-right on desktop environments", () => {
  const environment = {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    maxTouchPoints: 0,
    hasCoarsePointer: false,
    viewportWidth: 1440,
    viewportHeight: 900,
  };
  const style = getInlinePopupPlacementStyle({
    ...environment,
  });

  assert.equal(shouldPlacePopupAtBottom(environment), false);
  assert.equal(style.top, "16px");
  assert.equal(style.right, "16px");
  assert.equal(style.bottom, undefined);
  assert.equal(style.left, undefined);
  assert.equal(style.transform, undefined);
});

test("popup moves to bottom-center on Android phones", () => {
  const style = getInlinePopupPlacementStyle({
    userAgent:
      "Mozilla/5.0 (Android 14; Mobile; rv:137.0) Gecko/137.0 Firefox/137.0",
    maxTouchPoints: 5,
    hasCoarsePointer: true,
    viewportWidth: 412,
    viewportHeight: 915,
  });

  assert.equal(style.bottom, "16px");
  assert.equal(style.left, "50%");
  assert.equal(style.transform, "translateX(-50%)");
  assert.equal(style.top, undefined);
  assert.equal(style.right, undefined);
});

test("popup moves to bottom-center on touch tablets even without a mobile user agent token", () => {
  const style = getInlinePopupPlacementStyle({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    maxTouchPoints: 10,
    hasCoarsePointer: true,
    viewportWidth: 1024,
    viewportHeight: 1366,
  });

  assert.equal(style.bottom, "16px");
  assert.equal(style.left, "50%");
  assert.equal(style.transform, "translateX(-50%)");
});

test("popup stays top-right on touch laptops with a fine pointer", () => {
  const style = getInlinePopupPlacementStyle({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    maxTouchPoints: 10,
    hasCoarsePointer: false,
    viewportWidth: 1440,
    viewportHeight: 900,
  });

  assert.equal(style.top, "16px");
  assert.equal(style.right, "16px");
  assert.equal(style.bottom, undefined);
  assert.equal(style.left, undefined);
});

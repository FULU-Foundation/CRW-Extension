import test from "node:test";
import assert from "node:assert/strict";

import { getInlinePopupInstruction } from "../src/content/messageRouting.ts";
import { entry } from "./helpers.ts";

const FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP";
const MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED";
const PAGE_SCAN_RESULT = "CRW_PAGE_SCAN_RESULT";

test("returns force-show instruction for browser-action click with zero matches", () => {
  const instruction = getInlinePopupInstruction({
    type: FORCE_SHOW_INLINE_POPUP,
    payload: [],
  });

  assert.ok(instruction);
  assert.equal(instruction.ignorePreferences, true);
  assert.deepEqual(instruction.matches, []);
});

test("returns force-show instruction for browser-action click with matches", () => {
  const matches = [
    entry({
      _type: "ProductLine",
      PageID: "pl-wallet",
      PageName: "Wallet",
    }),
  ];

  const instruction = getInlinePopupInstruction({
    type: FORCE_SHOW_INLINE_POPUP,
    payload: matches,
  });

  assert.ok(instruction);
  assert.equal(instruction.ignorePreferences, true);
  assert.equal(instruction.matches.length, 1);
  assert.equal(instruction.matches[0]?.PageID, "pl-wallet");
});

test("returns regular update instruction for match updates", () => {
  const matches = [
    entry({
      _type: "Company",
      PageID: "company-7eleven",
      PageName: "7-Eleven",
    }),
  ];

  const instruction = getInlinePopupInstruction({
    type: MATCH_RESULTS_UPDATED,
    payload: matches,
  });

  assert.ok(instruction);
  assert.equal(instruction.ignorePreferences, false);
  assert.equal(instruction.matches[0]?.PageID, "company-7eleven");
});

test("returns null for unrelated messages", () => {
  const instruction = getInlinePopupInstruction({
    type: PAGE_SCAN_RESULT,
    payload: [],
  });

  assert.equal(instruction, null);
});

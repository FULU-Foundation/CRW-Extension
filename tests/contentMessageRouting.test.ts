import test from "node:test";
import assert from "node:assert/strict";

import { getInlinePopupInstruction } from "../src/content/messageRouting.ts";
import { entry } from "./helpers.ts";

const FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP";
const HIDE_INLINE_POPUP = "CRW_HIDE_INLINE_POPUP";
const MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED";
const TOGGLE_INLINE_POPUP = "CRW_TOGGLE_INLINE_POPUP";
const TOGGLE_SNOOZE_CURRENT_SITE = "CRW_TOGGLE_SNOOZE_CURRENT_SITE";
const TOGGLE_SUPPRESS_CURRENT_SITE = "CRW_TOGGLE_SUPPRESS_CURRENT_SITE";
const PAGE_SCAN_RESULT = "CRW_PAGE_SCAN_RESULT";

test("returns force-show instruction for browser-action click with zero matches", () => {
  const instruction = getInlinePopupInstruction({
    type: FORCE_SHOW_INLINE_POPUP,
    payload: [],
  });

  assert.ok(instruction);
  assert.equal(instruction.action, "show");
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
  assert.equal(instruction.action, "show");
  assert.equal(instruction.ignorePreferences, true);
  assert.equal(instruction.matches.length, 1);
  assert.equal(instruction.matches[0]?.PageID, "pl-wallet");
});

test("returns toggle instruction for browser-action toggle clicks", () => {
  const matches = [
    entry({
      _type: "Company",
      PageID: "company-example",
      PageName: "Example",
    }),
  ];

  const instruction = getInlinePopupInstruction({
    type: TOGGLE_INLINE_POPUP,
    payload: matches,
  });

  assert.ok(instruction);
  assert.equal(instruction.action, "toggle");
  assert.equal(instruction.ignorePreferences, true);
  assert.equal(instruction.matches[0]?.PageID, "company-example");
});

test("returns hide instruction for hide shortcut command", () => {
  const instruction = getInlinePopupInstruction({
    type: HIDE_INLINE_POPUP,
  });

  assert.ok(instruction);
  assert.equal(instruction.action, "hide");
  assert.equal(instruction.ignorePreferences, true);
  assert.deepEqual(instruction.matches, []);
});

test("returns snooze instruction for snooze shortcut command", () => {
  const matches = [
    entry({
      _type: "Company",
      PageID: "company-snooze",
      PageName: "Snooze Co",
    }),
  ];

  const instruction = getInlinePopupInstruction({
    type: TOGGLE_SNOOZE_CURRENT_SITE,
    payload: matches,
  });

  assert.ok(instruction);
  assert.equal(instruction.action, "toggleSnooze");
  assert.equal(instruction.ignorePreferences, true);
  assert.equal(instruction.matches[0]?.PageID, "company-snooze");
});

test("returns suppress instruction for ignore shortcut command", () => {
  const matches = [
    entry({
      _type: "Company",
      PageID: "company-ignore",
      PageName: "Ignore Co",
    }),
  ];

  const instruction = getInlinePopupInstruction({
    type: TOGGLE_SUPPRESS_CURRENT_SITE,
    payload: matches,
  });

  assert.ok(instruction);
  assert.equal(instruction.action, "toggleSuppress");
  assert.equal(instruction.ignorePreferences, true);
  assert.equal(instruction.matches[0]?.PageID, "company-ignore");
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
  assert.equal(instruction.action, "show");
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

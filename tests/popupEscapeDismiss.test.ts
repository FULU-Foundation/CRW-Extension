import test from "node:test";
import assert from "node:assert/strict";

import {
  createPopupEscapeDismissHandler,
  isEditableEventTarget,
  shouldDismissPopupOnEscape,
  type EscapeDismissEvent,
} from "../src/content/popupEscapeDismiss.ts";

const escapeEvent = (
  overrides: Partial<EscapeDismissEvent> = {},
): EscapeDismissEvent => ({
  key: "Escape",
  ...overrides,
});

test("dismisses on an unmodified Escape press", () => {
  assert.equal(shouldDismissPopupOnEscape(escapeEvent()), true);
});

test("ignores keys other than Escape", () => {
  assert.equal(shouldDismissPopupOnEscape(escapeEvent({ key: "Esc" })), false);
  assert.equal(
    shouldDismissPopupOnEscape(escapeEvent({ key: "Enter" })),
    false,
  );
});

test("ignores Escape the page already handled", () => {
  assert.equal(
    shouldDismissPopupOnEscape(escapeEvent({ defaultPrevented: true })),
    false,
  );
});

test("ignores Escape while an IME composition is active", () => {
  assert.equal(
    shouldDismissPopupOnEscape(escapeEvent({ isComposing: true })),
    false,
  );
});

test("ignores modified Escape combos", () => {
  for (const modifier of [
    "altKey",
    "ctrlKey",
    "metaKey",
    "shiftKey",
  ] as const) {
    assert.equal(
      shouldDismissPopupOnEscape(escapeEvent({ [modifier]: true })),
      false,
      `${modifier} should be ignored`,
    );
  }
});

test("ignores Escape raised from an editable target", () => {
  for (const tagName of ["input", "TEXTAREA", "select"]) {
    assert.equal(
      shouldDismissPopupOnEscape(escapeEvent({ target: { tagName } })),
      false,
      `${tagName} should be ignored`,
    );
  }

  assert.equal(
    shouldDismissPopupOnEscape(
      escapeEvent({ target: { tagName: "DIV", isContentEditable: true } }),
    ),
    false,
  );
});

test("dismisses Escape raised from a non-editable target", () => {
  assert.equal(
    shouldDismissPopupOnEscape(
      escapeEvent({ target: { tagName: "DIV", isContentEditable: false } }),
    ),
    true,
  );
});

test("treats missing or non-element targets as non-editable", () => {
  assert.equal(isEditableEventTarget(undefined), false);
  assert.equal(isEditableEventTarget(null), false);
  assert.equal(isEditableEventTarget("INPUT"), false);
  assert.equal(isEditableEventTarget({}), false);
  assert.equal(isEditableEventTarget({ tagName: 42 }), false);
});

test("handler dismisses only while the popup is open", () => {
  let open = false;
  let dismissCount = 0;
  const handleKeyDown = createPopupEscapeDismissHandler({
    isPopupOpen: () => open,
    onDismiss: () => {
      dismissCount += 1;
    },
  });

  handleKeyDown(escapeEvent());
  assert.equal(dismissCount, 0);

  open = true;
  handleKeyDown(escapeEvent());
  assert.equal(dismissCount, 1);

  handleKeyDown(escapeEvent({ key: "a" }));
  assert.equal(dismissCount, 1);
});

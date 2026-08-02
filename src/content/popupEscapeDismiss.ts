/**
 * Escape-to-dismiss support for the in-page popup.
 *
 * The popup is injected into arbitrary third-party pages, so the handler is
 * deliberately conservative: it never calls `preventDefault()` or
 * `stopPropagation()`, it ignores events the page already handled, and it
 * leaves Escape alone while the user is typing.
 */

type EditableTarget = {
  tagName?: unknown;
  isContentEditable?: unknown;
};

export type EscapeDismissEvent = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
  defaultPrevented?: boolean;
  target?: unknown;
};

const EDITABLE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export const isEditableEventTarget = (target: unknown): boolean => {
  if (typeof target !== "object" || target === null) return false;

  const candidate = target as EditableTarget;
  if (candidate.isContentEditable === true) return true;

  const tagName = candidate.tagName;
  if (typeof tagName !== "string") return false;

  return EDITABLE_TAG_NAMES.has(tagName.toUpperCase());
};

export const shouldDismissPopupOnEscape = (
  event: EscapeDismissEvent,
): boolean => {
  if (event.key !== "Escape") return false;
  // The page (or an IME) already claimed this keypress.
  if (event.defaultPrevented) return false;
  if (event.isComposing) return false;
  // Modified Escape combos belong to the page or the browser.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }
  // Escape inside a field usually reverts or clears it.
  if (isEditableEventTarget(event.target)) return false;

  return true;
};

interface PopupEscapeDismissOptions {
  isPopupOpen: () => boolean;
  onDismiss: () => void;
}

export const createPopupEscapeDismissHandler = ({
  isPopupOpen,
  onDismiss,
}: PopupEscapeDismissOptions): ((event: EscapeDismissEvent) => void) => {
  return (event: EscapeDismissEvent): void => {
    if (!isPopupOpen()) return;
    if (!shouldDismissPopupOnEscape(event)) return;

    onDismiss();
  };
};

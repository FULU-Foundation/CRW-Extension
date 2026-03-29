import type { CargoEntry } from "@/shared/types";
import { decodeCargoEntries } from "@/shared/types";
import { MessageType } from "@/messaging/type";

export type InlinePopupInstruction = {
  action: "show" | "toggle" | "hide" | "toggleSnooze" | "toggleSuppress";
  matches: CargoEntry[];
  ignorePreferences: boolean;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toCargoEntries = (payload: unknown): CargoEntry[] => {
  return decodeCargoEntries(payload);
};

export const getInlinePopupInstruction = (
  message: unknown,
): InlinePopupInstruction | null => {
  if (!isObjectRecord(message)) return null;

  const messageType = message.type;
  if (messageType === MessageType.MATCH_RESULTS_UPDATED) {
    return {
      action: "show",
      matches: toCargoEntries(message.payload),
      ignorePreferences: false,
    };
  }

  if (messageType === MessageType.FORCE_SHOW_INLINE_POPUP) {
    return {
      action: "show",
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
    };
  }

  if (messageType === MessageType.TOGGLE_INLINE_POPUP) {
    return {
      action: "toggle",
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
    };
  }

  if (messageType === MessageType.HIDE_INLINE_POPUP) {
    return {
      action: "hide",
      matches: [],
      ignorePreferences: true,
    };
  }

  if (messageType === MessageType.TOGGLE_SNOOZE_CURRENT_SITE) {
    return {
      action: "toggleSnooze",
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
    };
  }

  if (messageType === MessageType.TOGGLE_SUPPRESS_CURRENT_SITE) {
    return {
      action: "toggleSuppress",
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
    };
  }

  return null;
};

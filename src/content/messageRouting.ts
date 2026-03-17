import type { CargoEntry } from "@/shared/types";
import { decodeCargoEntries } from "@/shared/types";
import { MessageType } from "@/messaging/type";

export type InlinePopupInstruction = {
  matches: CargoEntry[];
  ignorePreferences: boolean;
  toggle: boolean;
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
      matches: toCargoEntries(message.payload),
      ignorePreferences: false,
      toggle: false,
    };
  }

  if (messageType === MessageType.FORCE_SHOW_INLINE_POPUP) {
    return {
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
      toggle: false,
    };
  }

  if (messageType === MessageType.TOGGLE_INLINE_POPUP) {
    return {
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
      toggle: true,
    };
  }

  return null;
};

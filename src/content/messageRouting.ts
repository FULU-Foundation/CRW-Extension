import type { CargoEntry } from "@/shared/types";

const MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED";
const FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP";

export type InlinePopupInstruction = {
  matches: CargoEntry[];
  ignorePreferences: boolean;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toCargoEntries = (payload: unknown): CargoEntry[] => {
  return Array.isArray(payload) ? (payload as CargoEntry[]) : [];
};

export const getInlinePopupInstruction = (
  message: unknown,
): InlinePopupInstruction | null => {
  if (!isObjectRecord(message)) return null;

  const messageType = message.type;
  if (messageType === MATCH_RESULTS_UPDATED) {
    return {
      matches: toCargoEntries(message.payload),
      ignorePreferences: false,
    };
  }

  if (messageType === FORCE_SHOW_INLINE_POPUP) {
    return {
      matches: toCargoEntries(message.payload),
      ignorePreferences: true,
    };
  }

  return null;
};

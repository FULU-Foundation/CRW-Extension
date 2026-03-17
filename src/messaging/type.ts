import type { CargoEntry, PageContext } from "@/shared/types";

export enum MessageType {
  PAGE_CONTEXT_UPDATE = "CRW_PAGE_CONTEXT_UPDATE",
  MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED",
  FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP",
  TOGGLE_INLINE_POPUP = "CRW_TOGGLE_INLINE_POPUP",
  OPEN_OPTIONS_PAGE = "CRW_OPEN_OPTIONS_PAGE",
  REFRESH_DATASET_NOW = "CRW_REFRESH_DATASET_NOW",
}

export type MessageSource = "background" | "content" | "popup" | "options";

export type MessagePayloadByType = {
  [MessageType.PAGE_CONTEXT_UPDATE]: PageContext;
  [MessageType.MATCH_RESULTS_UPDATED]: CargoEntry[];
  [MessageType.FORCE_SHOW_INLINE_POPUP]: CargoEntry[];
  [MessageType.TOGGLE_INLINE_POPUP]: CargoEntry[];
  [MessageType.OPEN_OPTIONS_PAGE]: undefined;
  [MessageType.REFRESH_DATASET_NOW]: undefined;
};

export type CRWMessage<TType extends MessageType = MessageType> = {
  type: TType;
  source: MessageSource;
  payload?: MessagePayloadByType[TType];
};

export type AnyCRWMessage = {
  [TType in MessageType]: CRWMessage<TType>;
}[MessageType];

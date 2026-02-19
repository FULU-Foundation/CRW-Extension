export enum MessageType {
  PAGE_CONTEXT_UPDATE = "CRW_PAGE_CONTEXT_UPDATE",
  PAGE_SCAN_RESULT = "CRW_PAGE_SCAN_RESULT",
  MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED",
  FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP",
}

export interface CRWMessage<T = any> {
  type: MessageType;
  source: "content" | "backgroud" | "popup";
  payload?: T;
}

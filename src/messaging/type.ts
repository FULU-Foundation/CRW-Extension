export enum MessageType {
  PAGE_CONTEXT_UPDATE = "CRW_PAGE_CONTEXT_UPDATE",
  MATCH_RESULTS_UPDATED = "CRW_MATCH_RESULTS_UPDATED",
  FORCE_SHOW_INLINE_POPUP = "CRW_FORCE_SHOW_INLINE_POPUP",
  OPEN_OPTIONS_PAGE = "CRW_OPEN_OPTIONS_PAGE",
  REFRESH_DATASET_NOW = "CRW_REFRESH_DATASET_NOW",
}

export interface CRWMessage<T = any> {
  type: MessageType;
  source: "content" | "backgroud" | "popup" | "options";
  payload?: T;
}

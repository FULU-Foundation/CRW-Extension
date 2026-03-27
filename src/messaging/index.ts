import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import {
  type AnyCRWMessage,
  type CRWMessage,
  type MessagePayloadByType,
  type MessageSource,
  MessageType,
} from "./type";
import { decodePageContext } from "@/shared/types";

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isMessageType = (value: unknown): value is MessageType => {
  return (
    value === MessageType.PAGE_CONTEXT_UPDATE ||
    value === MessageType.MATCH_RESULTS_UPDATED ||
    value === MessageType.FORCE_SHOW_INLINE_POPUP ||
    value === MessageType.TOGGLE_INLINE_POPUP ||
    value === MessageType.HIDE_INLINE_POPUP ||
    value === MessageType.TOGGLE_SNOOZE_CURRENT_SITE ||
    value === MessageType.TOGGLE_SUPPRESS_CURRENT_SITE ||
    value === MessageType.OPEN_OPTIONS_PAGE ||
    value === MessageType.REFRESH_DATASET_NOW
  );
};

const decodeMessage = (value: unknown): AnyCRWMessage | null => {
  if (!isObjectRecord(value)) return null;
  if (!isMessageType(value.type)) return null;
  return value as AnyCRWMessage;
};

/**
 * Helper to create typed messages
 */
export function createMessage<TType extends MessageType>(
  type: TType,
  source: MessageSource,
  ...payload: MessagePayloadByType[TType] extends undefined
    ? []
    : [payload: MessagePayloadByType[TType]]
): CRWMessage<TType> {
  if (payload.length === 0) {
    return { type, source };
  }
  return { type, source, payload: payload[0] };
}

/**
 * Share dispatcher analyzer for background service
 */
export function createBackgroundMessageHandler(handlers: {
  onPageContextUpdated?: (
    payload: MessagePayloadByType[MessageType.PAGE_CONTEXT_UPDATE],
    sender: browser.Runtime.MessageSender,
  ) => void | Promise<void>;
  onOpenOptionsPage?: (
    sender: browser.Runtime.MessageSender,
  ) => void | Promise<void>;
  onRefreshDatasetNow?: (
    sender: browser.Runtime.MessageSender,
  ) => unknown | Promise<unknown>;
}) {
  browser.runtime.onMessage.addListener(
    (msg: unknown, sender: browser.Runtime.MessageSender) => {
      const decodedMessage = decodeMessage(msg);
      if (!decodedMessage) return;

      switch (decodedMessage.type) {
        case MessageType.PAGE_CONTEXT_UPDATE: {
          const payload = decodePageContext(decodedMessage.payload);
          if (!payload) return;
          handlers.onPageContextUpdated?.(payload, sender);
          break;
        }
        case MessageType.OPEN_OPTIONS_PAGE:
          return handlers.onOpenOptionsPage?.(sender);
        case MessageType.REFRESH_DATASET_NOW:
          return handlers.onRefreshDatasetNow?.(sender);

        default:
          console.warn(
            `${Constants.LOG_PREFIX} Unknown message type:`,
            decodedMessage.type,
          );
          return;
      }
    },
  );
}

import browser from "webextension-polyfill";
import * as Constants from "@/shared/constants";
import { CRWMessage, MessageType } from "./type";
import { PageContext } from "@/shared/types";

/**
 * Helper to create typed messages
 */
export function createMessage<T>(
  type: MessageType,
  source: CRWMessage["source"],
  payload?: T,
): CRWMessage<T> {
  return { type, source, payload };
}

/**
 * Share dispatcher analyzer for background service
 */
export function createBackgroundMessageHandler(handlers: {
  onPageContextUpdated?: (
    payload: PageContext,
    sender: browser.Runtime.MessageSender,
  ) => void;
}) {
  browser.runtime.onMessage.addListener(
    (msg: CRWMessage | any, sender: browser.Runtime.MessageSender) => {
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case MessageType.PAGE_CONTEXT_UPDATE:
          handlers.onPageContextUpdated?.(msg.payload, sender);
          break;

        default:
          console.warn(
            `${Constants.LOG_PREFIX} Unknown message type:`,
            msg.type,
          );
          break;
      }
    },
  );
}

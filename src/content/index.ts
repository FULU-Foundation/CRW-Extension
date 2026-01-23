import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { PageContext } from "@/shared/types";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";

console.log(
  `${Constants.LOG_PREFIX} Content script loaded on:`,
  window.location.href,
);

const runContentScript = () => {
  const context: PageContext = {
    url: location.href.toLocaleLowerCase(),
    hostname: location.hostname.toLocaleLowerCase(),
  };

  browser.runtime.sendMessage(
    Messaging.createMessage(
      MessageType.PAGE_CONTEXT_UPDATE,
      "content",
      context,
    ),
  );
};

runContentScript();

import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  matchByPageContext,
  matchByUrl,
} from "../src/lib/matching/matching.ts";
import {
  resetMatchingConfig,
  setMatchingConfig,
} from "../src/lib/matching/matchingConfig.ts";
import { entry, relationFixture } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

afterEach(() => {
  resetMatchingConfig();
});

test("matchByUrl returns related expanded entries from URL seed matches", () => {
  const dataset = relationFixture();
  const results = matchByUrl(dataset, "https://acme.com/security");
  const ids = results.map((item) => item.PageID);

  assert.ok(ids.includes("company-acme"));
  assert.ok(ids.includes("pl-acme-home"));
  assert.ok(ids.includes("product-acme-cam"));
  assert.ok(ids.includes("incident-acme-breach"));
  assert.ok(!ids.includes("company-other"));
});

test("matchByPageContext prioritizes exact non-company URL match before company meta hits", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-7eleven",
      PageName: "7-Eleven",
      Website: "https://7-eleven.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-wallet",
      PageName: "Wallet",
      Company: "7-Eleven",
      Website: "https://www.7-eleven.com/7rewards/7-eleven-wallet",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.7-eleven.com/7rewards/7-eleven-wallet",
    hostname: "www.7-eleven.com",
    title: "7-Eleven Wallet",
    meta: {
      description: "Pay with 7-Eleven Wallet",
      "og:title": "7-Eleven Wallet",
      "og:description": "7-Eleven Wallet",
    },
  });

  assert.equal(results[0]?.PageID, "pl-wallet");
});

test("matchByPageContext promotes meta match when URL seed is company on ecommerce hosts", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/s?k=airpods",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods listing",
    meta: {
      description: "Find Apple AirPods deals",
      "og:title": "Apple AirPods listing",
      "og:description": "Buy Apple AirPods on Amazon",
    },
  });

  assert.equal(results[0]?.PageID, "pl-airpods");
});

test("matchByPageContext ignores meta-title seeds on non-ecommerce hosts", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-github",
      PageName: "GitHub",
      Website: "https://github.com/",
    }),
    entry({
      _type: "Product",
      PageID: "product-telegram",
      PageName: "Telegram",
      Website: "https://telegram.org/",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://github.com/qwibitai/nanoclaw",
    hostname: "github.com",
    title:
      "GitHub - qwibitai/nanoclaw: Connects to WhatsApp, Telegram, Slack, Discord",
    meta: {
      title:
        "A lightweight tool that connects to WhatsApp, telegram, Slack, Discord, and Gmail",
      description:
        "A lightweight tool that connects to WhatsApp, Telegram, Slack, Discord, and Gmail",
      "og:title":
        "GitHub - qwibitai/nanoclaw: Connects to WhatsApp, Telegram, Slack, Discord",
      "og:description":
        "A lightweight tool that connects to WhatsApp, Telegram, Slack, Discord, and Gmail",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-github"));
  assert.equal(ids.includes("product-telegram"), false);
});

test("matchByPageContext can allow non-ecommerce meta seeds when restriction is disabled", () => {
  setMatchingConfig({
    restrictMetaPageContextToEcommerceHosts: false,
  });

  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-github",
      PageName: "GitHub",
      Website: "https://github.com/",
    }),
    entry({
      _type: "Product",
      PageID: "product-telegram",
      PageName: "Telegram",
      Website: "https://telegram.org/",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://github.com/qwibitai/nanoclaw",
    hostname: "github.com",
    title:
      "GitHub - qwibitai/nanoclaw: Connects to WhatsApp, Telegram, Slack, Discord",
    meta: {
      title:
        "A lightweight tool that connects to WhatsApp, telegram, Slack, Discord, and Gmail",
      description:
        "A lightweight tool that connects to WhatsApp, Telegram, Slack, Discord, and Gmail",
      "og:title":
        "GitHub - qwibitai/nanoclaw: Connects to WhatsApp, Telegram, Slack, Discord",
      "og:description":
        "A lightweight tool that connects to WhatsApp, Telegram, Slack, Discord, and Gmail",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-github"));
  assert.ok(ids.includes("product-telegram"));
});

test("matchByPageContext does not use search results page text on google search pages", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-google",
      PageName: "Google",
      Website: "https://google.com/",
    }),
    entry({
      _type: "Company",
      PageID: "company-fitbit",
      PageName: "Fitbit",
      Website: "https://fitbit.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-fitbit",
      PageName: "Fitbit",
      Company: "Google",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.google.com/search?q=fitbit",
    hostname: "www.google.com",
    title: "fitbit - Google Search",
    meta: {
      description: "Search results for fitbit",
      "og:title": "fitbit - Google Search",
      "og:description":
        "Search the world's information, including webpages about fitbit",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.equal(ids.includes("company-google"), false);
  assert.equal(ids.includes("company-fitbit"), false);
  assert.equal(ids.includes("pl-fitbit"), false);
  assert.equal(results.length, 0);
});

test("matchByPageContext suppresses duckduckgo root search pages only when q is present", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-duckduckgo",
      PageName: "DuckDuckGo",
      Website: "https://duckduckgo.com/",
    }),
  ];

  const searchResults = matchByPageContext(dataset, {
    url: "https://duckduckgo.com/?q=hello&ia=web",
    hostname: "duckduckgo.com",
    title: "hello at DuckDuckGo",
    meta: {
      description: "DuckDuckGo search results",
    },
  });
  assert.equal(searchResults.length, 0);

  const homepageResults = matchByPageContext(dataset, {
    url: "https://duckduckgo.com/",
    hostname: "duckduckgo.com",
    title: "DuckDuckGo",
    meta: {
      description: "Privacy, simplified.",
    },
  });

  const ids = homepageResults.map((item) => item.PageID);
  assert.ok(ids.includes("company-duckduckgo"));
});

test("matchByPageContext suppresses bing and yahoo search result pages by default", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-bing",
      PageName: "Bing",
      Website: "https://www.bing.com/",
    }),
    entry({
      _type: "Company",
      PageID: "company-yahoo",
      PageName: "Yahoo",
      Website: "https://search.yahoo.com/",
    }),
  ];

  const bingResults = matchByPageContext(dataset, {
    url: "https://www.bing.com/search?q=hello",
    hostname: "www.bing.com",
    title: "hello - Search",
    meta: {
      description: "Bing search results",
    },
  });
  assert.equal(bingResults.length, 0);

  const yahooResults = matchByPageContext(dataset, {
    url: "https://search.yahoo.com/search?p=hello",
    hostname: "search.yahoo.com",
    title: "hello - Yahoo Search Results",
    meta: {
      description: "Yahoo Search results",
    },
  });
  assert.equal(yahooResults.length, 0);
});

test("matchByPageContext search-results suppression is configurable", () => {
  setMatchingConfig({
    searchResultsPageSuppressions: [],
  });

  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-google",
      PageName: "Google",
      Website: "https://google.com/",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.google.com/search?q=foobar",
    hostname: "www.google.com",
    title: "foobar - Google Search",
    meta: {
      description: "Search results for foobar",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-google"));
});

test("matchByPageContext search-results suppression can be disabled via flag", () => {
  setMatchingConfig({
    enableSearchResultsPageSuppressions: false,
  });

  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-google",
      PageName: "Google",
      Website: "https://google.com/",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.google.com/search?q=foobar",
    hostname: "www.google.com",
    title: "foobar - Google Search",
    meta: {
      description: "Search results for foobar",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-google"));
});

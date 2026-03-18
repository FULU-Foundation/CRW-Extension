import test from "node:test";
import assert from "node:assert/strict";

import { matchEntriesByPageContext } from "../src/lib/matching/pageContextMatching.ts";
import { entry } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

const fixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
    entry({
      _type: "Product",
      PageID: "product-electron",
      PageName: "Electron",
    }),
  ];
};

test("matches ecommerce entities from title/description", () => {
  const results = matchEntriesByPageContext(fixture(), {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
});

test("does not match by partial substring (Electron vs Electronics)", () => {
  const results = matchEntriesByPageContext(fixture(), {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.equal(ids.includes("product-electron"), false);
});

test("matches entities from og:title and og:description", () => {
  const results = matchEntriesByPageContext(fixture(), {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "",
    meta: {
      description: "",
      "og:title": "Apple AirPods 4",
      "og:description": "Apple AirPods 4 wireless earbuds",
    },
  });

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
});

test("matches two-letter company names like HP on ecommerce listings", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Company",
        PageID: "company-hp",
        PageName: "HP",
      }),
    ],
    {
      url: "https://www.amazon.com/HP-15-6-inch-Laptop/dp/B000000001",
      hostname: "www.amazon.com",
      title: "HP 15.6-inch Laptop : Amazon.com",
      meta: {
        description: "HP laptop for home and office",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-hp"));
});

test("matches company aliases when legal suffixes are omitted in listing titles", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Company",
        PageID: "company-brother",
        PageName: "Brother Industries Ltd.",
      }),
    ],
    {
      url: "https://www.amazon.com/Brother-Laser-Printer/dp/B000000002",
      hostname: "www.amazon.com",
      title: "Brother Compact Monochrome Laser Printer : Amazon.com",
      meta: {
        description: "Brother printer for small office use",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-brother"));
});

test("matches company aliases from comma-separated CompanyAlias field", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Company",
        PageID: "company-pg",
        PageName: "Procter & Gamble",
        CompanyAlias: "P&G, PG",
      }),
    ],
    {
      url: "https://www.amazon.com/Pampers-Swaddlers/dp/B000000003",
      hostname: "www.amazon.com",
      title: "P&G Pampers Swaddlers : Amazon.com",
      meta: {
        description: "P&G diapers for newborns",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-pg"));
});

test("matches company aliases from space-separated CompanyAlias field", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Company",
        PageID: "company-ibm",
        PageName: "International Business Machines",
        CompanyAlias: "IBM BigBlue",
      }),
    ],
    {
      url: "https://www.example.com/products/server",
      hostname: "www.example.com",
      title: "BigBlue rack server",
      meta: {
        description: "Enterprise hardware from BigBlue",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("company-ibm"));
});

test("does not match product mentioned only in compatibility list when brand differs", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Product",
        PageID: "product-steam-deck",
        PageName: "Steam Deck",
        Company: "Valve",
      }),
      entry({
        _type: "Company",
        PageID: "company-valve",
        PageName: "Valve",
        Website: "https://store.steampowered.com/",
      }),
    ],
    {
      url: "https://www.amazon.fr/UGREEN-DisplayPort-Commutateur/dp/B0F47VTB29",
      hostname: "www.amazon.fr",
      title:
        "UGREEN Switch DisplayPort USB C 8K60Hz Compatible avec PC PS5 Xbox One Steam Deck",
      meta: {
        description: "UGREEN USB C DisplayPort switch",
      },
      marketplaceProperties: {
        brand: "UGREEN",
        manufacturer: "UGREEN",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.equal(
    ids.includes("product-steam-deck"),
    false,
    "Steam Deck should not match when brand is UGREEN",
  );
  assert.equal(
    ids.includes("company-valve"),
    false,
    "Valve should not match when brand is UGREEN",
  );
});

test("still matches product when marketplace brand aligns with product company", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Product",
        PageID: "product-steam-deck",
        PageName: "Steam Deck",
        Company: "Valve",
      }),
      entry({
        _type: "Company",
        PageID: "company-valve",
        PageName: "Valve",
        Website: "https://store.steampowered.com/",
      }),
    ],
    {
      url: "https://www.amazon.com/Valve-Steam-Deck-OLED-1TB/dp/B0DEXAMPLE",
      hostname: "www.amazon.com",
      title: "Valve Steam Deck OLED 1TB",
      meta: {
        description: "Valve Steam Deck OLED handheld gaming PC",
      },
      marketplaceProperties: {
        brand: "Valve",
        manufacturer: "Valve",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(
    ids.includes("product-steam-deck"),
    "Steam Deck should match when brand is Valve",
  );
});

test("matches provided CompanyAlias values for X Corp record", () => {
  const results = matchEntriesByPageContext(
    [
      ...fixture(),
      entry({
        _type: "Company",
        PageID: "179",
        PageName: "X Corp",
        Description:
          "X Corp. is known for acquiring and rebranding Twitter and developing the AI model Grok.",
        Industry: "Social media, Artificial intelligence",
        ParentCompany: "X.AI Corp.",
        CompanyAlias: "Twitter, X, FailWhale",
        Type: "Private",
        Website: "https://x.com/",
      }),
    ],
    {
      url: "https://www.example.com/news/x-platform-update",
      hostname: "www.example.com",
      title: "FailWhale returns: legacy Twitter users report outage",
      meta: {
        description: "Twitter outage trends as users discuss FailWhale again",
      },
    },
  );

  const ids = results.map((entryItem) => entryItem.PageID);
  assert.ok(ids.includes("179"));
});

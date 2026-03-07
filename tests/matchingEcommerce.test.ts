import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { matchByPageContext } from "../src/lib/matching/matching.ts";
import {
  matchingConfig,
  resetMatchingConfig,
  setMatchingConfig,
} from "../src/lib/matching/matchingConfig.ts";
import { entry } from "./helpers.ts";
import type { CargoEntry } from "../src/shared/types.ts";

afterEach(() => {
  resetMatchingConfig();
});

const ecommerceFixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
      Website: "https://apple.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-airpods",
      PageName: "AirPods",
      Company: "Apple",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-apple-repair",
      PageName: "Apple anti-repair practices",
      Company: "Apple",
      ProductLine: "AirPods",
    }),
  ];
};

const AMAZON_TOYOTA_EXAMPLE_URL =
  "https://www.amazon.com.au/SWRTY-61S-Replacement-Retention-Vehicles-2003-2011/dp/B01BM3QGD8";
const EBAY_AIRPODS_EXAMPLE_URL = "https://www.ebay.com.au/itm/236467312490";

const AMAZON_AUTOBRIDGE_TABLE_HTML = `<tbody><tr class="a-spacing-small po-brand" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Brand</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">AUTOBRIDGE</span>   </td> </tr>  <tr class="a-spacing-small po-material" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Material</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">Copper Polyvinyl Chloride (PVC)</span>   </td> </tr>  <tr class="a-spacing-small po-item_dimensions" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Item dimensions L x W x H</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">25 x 25 x 25 millimetres</span>   </td> </tr>  <tr class="a-spacing-small po-connector_type" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Connector type</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">3.5mm Jack</span>   </td> </tr>  <tr class="a-spacing-small po-manufacturer" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Manufacturer</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">AUTOBRIDGE</span>   </td> </tr>    </tbody>`;

const AMAZON_TOYOTA_BRAND_TABLE_HTML = `<tbody><tr class="a-spacing-small po-brand" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Brand</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">TOYOTA</span>   </td> </tr>  <tr class="a-spacing-small po-material" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Material</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">Copper Polyvinyl Chloride (PVC)</span>   </td> </tr>  <tr class="a-spacing-small po-item_dimensions" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Item dimensions L x W x H</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">25 x 25 x 25 millimetres</span>   </td> </tr>  <tr class="a-spacing-small po-connector_type" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Connector type</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">3.5mm Jack</span>   </td> </tr>  <tr class="a-spacing-small po-manufacturer" role="listitem"> <td class="a-span3" role="presentation">     <span class="a-size-base a-text-bold">Manufacturer</span>   </td> <td class="a-span9" role="presentation">    <span class="a-size-base po-break-word">TOYOTA</span>   </td> </tr>    </tbody>`;

const AMAZON_AUTOBRIDGE_HEAD_HTML = `<head><meta name="title" content="AUTOBRIDGE SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics"><title>AUTOBRIDGE SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics</title><meta name="description" content="AUTOBRIDGE SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics"></head>`;

const AMAZON_TOYOTA_BRAND_HEAD_HTML = `<head><meta name="title" content="TOYOTA SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics"><title>TOYOTA SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics</title><meta name="description" content="TOYOTA SWRTY-61S Install New CAR Stereo in Select 2003-2013 Toyota Vehicles Toy : Amazon.com.au: Electronics"></head>`;
const EBAY_AIRPODS_JSONLD_SCRIPT = `<script type=application/ld+json>{"@type":"Product","@context":"https://schema.org","name":"For Apple AirPods 4 wireless earphones with USB-C Charging Case 4th + Free Cable","image":["https://i.ebayimg.com/images/g/nYMAAeSwfOJpMmjV/s-l1600.png","https://i.ebayimg.com/images/g/k4wAAeSwPOlpMmjc/s-l1600.png"],"offers":{"@type":"Offer","url":"https://www.ebay.com.au/itm/236467312490","itemCondition":"https://schema.org/NewCondition","availability":"https://schema.org/InStock","priceCurrency":"AUD","price":"59.45"},"model":"Airpods 4th Generation","brand":{"@type":"Brand","name":"Apple"}}</script>`;

const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

const collapseWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const extractMetaContent = (headHtml: string, name: string): string => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directPattern = new RegExp(
    `<meta[^>]*name=["']${escapedName}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const directMatch = headHtml.match(directPattern);
  if (directMatch?.[1]) {
    return collapseWhitespace(decodeHtmlEntities(directMatch[1]));
  }

  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${escapedName}["'][^>]*>`,
    "i",
  );
  const reverseMatch = headHtml.match(reversePattern);
  if (reverseMatch?.[1]) {
    return collapseWhitespace(decodeHtmlEntities(reverseMatch[1]));
  }

  return "";
};

const extractTitleTag = (headHtml: string): string => {
  const match = headHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return "";
  return collapseWhitespace(decodeHtmlEntities(match[1]));
};

const extractMarketplacePropertiesFromTable = (
  tableHtml: string,
): Record<string, string> => {
  const properties: Record<string, string> = {};
  const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rowMatches) {
    const cellMatches = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    if (cellMatches.length < 2) continue;

    const key = collapseWhitespace(
      decodeHtmlEntities(cellMatches[0].replace(/<[^>]+>/g, "")),
    ).toLowerCase();
    const value = collapseWhitespace(
      decodeHtmlEntities(cellMatches[1].replace(/<[^>]+>/g, "")),
    );
    if (!value) continue;
    if (key === "brand") properties.brand = value;
    if (key === "manufacturer") properties.manufacturer = value;
  }
  return properties;
};

const extractMarketplacePropertiesFromEbayJsonLdScript = (
  scriptHtml: string,
): Record<string, string> => {
  const properties: Record<string, string> = {};
  const productNodes: Array<Record<string, unknown>> = [];
  const hasProductType = (value: unknown): boolean => {
    if (typeof value === "string")
      return value.trim().toLowerCase() === "product";
    if (Array.isArray(value)) return value.some((item) => hasProductType(item));
    return false;
  };
  const collectProductNodes = (value: unknown): void => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) collectProductNodes(item);
      return;
    }
    if (typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (hasProductType(node["@type"])) productNodes.push(node);
    if (node["@graph"]) collectProductNodes(node["@graph"]);
  };
  const readLinkedName = (value: unknown): string => {
    if (typeof value === "string") return collapseWhitespace(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const name = readLinkedName(item);
        if (name) return name;
      }
      return "";
    }
    if (!value || typeof value !== "object") return "";
    const node = value as Record<string, unknown>;
    if (typeof node.name === "string") return collapseWhitespace(node.name);
    return "";
  };

  const scriptPattern =
    /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = scriptPattern.exec(scriptHtml);
  while (match) {
    const payloadRaw = (match[1] || "").trim();
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw) as unknown;
        collectProductNodes(payload);
      } catch {
        // Ignore malformed JSON-LD scripts and continue scanning.
      }
    }
    match = scriptPattern.exec(scriptHtml);
  }

  for (const node of productNodes) {
    const brand = readLinkedName(node.brand);
    const manufacturer = readLinkedName(node.manufacturer);
    if (brand && !properties.schemaProductBrand) {
      properties.schemaProductBrand = brand;
    }
    if (manufacturer && !properties.schemaProductManufacturer) {
      properties.schemaProductManufacturer = manufacturer;
    }
    if (properties.schemaProductBrand && properties.schemaProductManufacturer) {
      break;
    }
  }

  return properties;
};

test("matchByPageContext matches ecommerce page when meta/title contain entity", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/Apple-MXP63ZA-A-AirPods-4/dp/B0DGJ2X3QV",
    hostname: "www.amazon.com.au",
    title: "Apple AirPods 4 : Amazon.com.au: Electronics",
    meta: {
      description: "Apple AirPods 4 : Amazon.com.au: Electronics",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-apple"));
  assert.ok(ids.includes("pl-airpods"));
  assert.ok(ids.includes("incident-apple-repair"));
});

test("matchByPageContext falls back to ecommerce URL alias matches when meta/title have no entity signal", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com.au/random-listing/dp/B000000000",
    hostname: "www.amazon.com.au",
    title: "Premium USB Cable : Amazon.com.au: Electronics",
    meta: {
      description: "Fast charging usb cable bundle",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("company-amazon"));
  assert.equal(ids.includes("company-apple"), false);
});

test("matchByPageContext does not run meta-only matches without URL/domain seed", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://example.org/products/airpods",
    hostname: "example.org",
    title: "Apple AirPods 4 review",
    meta: {
      description: "Apple AirPods 4 review",
      "og:title": "Apple AirPods 4 review",
      "og:description": "Apple AirPods 4 review",
    },
  });

  assert.equal(results.length, 0);
});

test("matchByPageContext allows meta-only matching on ecommerce hosts without URL seed", () => {
  const dataset = ecommerceFixture();
  const results = matchByPageContext(dataset, {
    url: "https://www.ebay.com/itm/1566543210",
    hostname: "www.ebay.com",
    title: "Apple AirPods 4 Wireless Earbuds - White | eBay",
    meta: {
      description: "Shop Apple AirPods 4 at eBay",
      "og:title": "Apple AirPods 4 Wireless Earbuds",
      "og:description": "Buy Apple AirPods on eBay",
    },
  });

  const ids = results.map((item) => item.PageID);
  assert.ok(ids.includes("pl-airpods"));
  assert.ok(ids.includes("company-apple"));
});

test("matchByPageContext uses eBay Product JSON-LD brand when available", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-ebay",
      PageName: "eBay",
      Website: "https://ebay.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
      Website: "https://apple.com/",
    }),
  ];
  const marketplaceProperties =
    extractMarketplacePropertiesFromEbayJsonLdScript(
      EBAY_AIRPODS_JSONLD_SCRIPT,
    );
  const results = matchByPageContext(dataset, {
    url: EBAY_AIRPODS_EXAMPLE_URL,
    hostname: "www.ebay.com.au",
    title: "Wireless earphones with USB-C Charging Case 4th",
    meta: {
      title: "Wireless earphones with USB-C Charging Case 4th",
      description: "Compatible wireless earphones with charging case",
    },
    marketplaceProperties,
  });
  const ids = results.map((item) => item.PageID);

  assert.equal(marketplaceProperties.schemaProductBrand, "Apple");
  assert.equal(results[0]?.PageID, "company-apple");
  assert.ok(ids.includes("company-ebay"));
});

test("matchByPageContext eBay Product JSON-LD matching can be disabled via matchingConfig", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-ebay",
      PageName: "eBay",
      Website: "https://ebay.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-apple",
      PageName: "Apple",
      Website: "https://apple.com/",
    }),
  ];
  const marketplaceProperties =
    extractMarketplacePropertiesFromEbayJsonLdScript(
      EBAY_AIRPODS_JSONLD_SCRIPT,
    );

  const enabledResults = matchByPageContext(dataset, {
    url: EBAY_AIRPODS_EXAMPLE_URL,
    hostname: "www.ebay.com.au",
    title: "Wireless earphones with USB-C Charging Case 4th",
    meta: {
      title: "Wireless earphones with USB-C Charging Case 4th",
      description: "Compatible wireless earphones with charging case",
    },
    marketplaceProperties,
  });
  assert.equal(enabledResults[0]?.PageID, "company-apple");

  setMatchingConfig({
    ebayJsonLdProductMatching: {
      ...matchingConfig.ebayJsonLdProductMatching,
      enabled: false,
    },
  });

  const disabledResults = matchByPageContext(dataset, {
    url: EBAY_AIRPODS_EXAMPLE_URL,
    hostname: "www.ebay.com.au",
    title: "Wireless earphones with USB-C Charging Case 4th",
    meta: {
      title: "Wireless earphones with USB-C Charging Case 4th",
      description: "Compatible wireless earphones with charging case",
    },
    marketplaceProperties,
  });
  const disabledIds = disabledResults.map((item) => item.PageID);

  assert.equal(disabledResults[0]?.PageID, "company-ebay");
  assert.equal(disabledIds.includes("company-apple"), false);
});

test("matchByPageContext uses Amazon Brand/Manufacturer properties from the provided table snippet", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-autobridge",
      PageName: "AUTOBRIDGE",
      Website: "https://autobridge.example/",
    }),
  ];

  const marketplaceProperties = extractMarketplacePropertiesFromTable(
    AMAZON_AUTOBRIDGE_TABLE_HTML,
  );
  const context = {
    url: AMAZON_TOYOTA_EXAMPLE_URL,
    hostname: "www.amazon.com.au",
    title: extractTitleTag(AMAZON_AUTOBRIDGE_HEAD_HTML),
    meta: {
      title: extractMetaContent(AMAZON_AUTOBRIDGE_HEAD_HTML, "title"),
      description: extractMetaContent(
        AMAZON_AUTOBRIDGE_HEAD_HTML,
        "description",
      ),
    },
    marketplaceProperties,
  };

  const results = matchByPageContext(dataset, context);
  const ids = results.map((item) => item.PageID);
  assert.equal(marketplaceProperties.brand, "AUTOBRIDGE");
  assert.equal(marketplaceProperties.manufacturer, "AUTOBRIDGE");
  assert.equal(results[0]?.PageID, "company-autobridge");
  assert.ok(ids.includes("company-amazon"));
});

test("matchByPageContext Amazon Brand/Manufacturer matching can be disabled via matchingConfig", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-autobridge",
      PageName: "AUTOBRIDGE",
      Website: "https://autobridge.example/",
    }),
  ];
  const marketplaceProperties = extractMarketplacePropertiesFromTable(
    AMAZON_AUTOBRIDGE_TABLE_HTML,
  );

  const enabledResults = matchByPageContext(dataset, {
    url: AMAZON_TOYOTA_EXAMPLE_URL,
    hostname: "www.amazon.com.au",
    title: "Install New CAR Stereo in Select Toyota Vehicles",
    meta: {
      title: "Install New CAR Stereo in Select Toyota Vehicles",
      description: "Single DIN harness replacement for selected models",
    },
    marketplaceProperties,
  });
  assert.equal(enabledResults[0]?.PageID, "company-autobridge");

  setMatchingConfig({
    amazonPropertyMatching: {
      ...matchingConfig.amazonPropertyMatching,
      enabled: false,
    },
  });

  const disabledResults = matchByPageContext(dataset, {
    url: AMAZON_TOYOTA_EXAMPLE_URL,
    hostname: "www.amazon.com.au",
    title: "Install New CAR Stereo in Select Toyota Vehicles",
    meta: {
      title: "Install New CAR Stereo in Select Toyota Vehicles",
      description: "Single DIN harness replacement for selected models",
    },
    marketplaceProperties,
  });
  const disabledIds = disabledResults.map((item) => item.PageID);

  assert.equal(disabledResults[0]?.PageID, "company-amazon");
  assert.equal(disabledIds.includes("company-autobridge"), false);
});

test("matchByPageContext company alias suffix stripping is configurable", () => {
  setMatchingConfig({
    companyAliasSuffixStripping: {
      enabled: false,
      legalSuffixTokens: [],
      genericTrailingTokens: [],
    },
  });

  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-brother",
      PageName: "Brother Industries Ltd.",
    }),
  ];

  const results = matchByPageContext(dataset, {
    url: "https://www.amazon.com/Brother-Laser-Printer/dp/B000000002",
    hostname: "www.amazon.com",
    title: "Brother Compact Monochrome Laser Printer : Amazon.com",
    meta: {
      description: "Brother printer for small office use",
    },
  });

  assert.equal(results.length, 0);
});

test("finds Toyota when Toyota is the Amazon Brand/Manufacturer", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-toyota",
      PageName: "Toyota",
      Website: "https://toyota.com/",
    }),
    entry({
      _type: "Company",
      PageID: "company-autobridge",
      PageName: "AUTOBRIDGE",
      Website: "https://autobridge.example/",
    }),
  ];

  const marketplaceProperties = extractMarketplacePropertiesFromTable(
    AMAZON_TOYOTA_BRAND_TABLE_HTML,
  );
  const results = matchByPageContext(dataset, {
    url: AMAZON_TOYOTA_EXAMPLE_URL,
    hostname: "www.amazon.com.au",
    title: extractTitleTag(AMAZON_TOYOTA_BRAND_HEAD_HTML),
    meta: {
      title: extractMetaContent(AMAZON_TOYOTA_BRAND_HEAD_HTML, "title"),
      description: extractMetaContent(
        AMAZON_TOYOTA_BRAND_HEAD_HTML,
        "description",
      ),
    },
    marketplaceProperties,
  });
  const ids = results.map((item) => item.PageID);

  assert.equal(marketplaceProperties.brand, "TOYOTA");
  assert.equal(marketplaceProperties.manufacturer, "TOYOTA");
  assert.equal(results[0]?.PageID, "company-toyota");
  assert.equal(ids.includes("company-autobridge"), false);
});

test("does not find Toyota when Toyota is only in product name but Brand/Manufacturer differs", () => {
  const dataset: CargoEntry[] = [
    entry({
      _type: "Company",
      PageID: "company-amazon",
      PageName: "Amazon",
      Website: "https://amazon.com.au/",
    }),
    entry({
      _type: "Company",
      PageID: "company-toyota",
      PageName: "Toyota",
      Website: "https://toyota.com/",
    }),
    entry({
      _type: "Company",
      PageID: "company-autobridge",
      PageName: "AUTOBRIDGE",
      Website: "https://autobridge.example/",
    }),
  ];

  const marketplaceProperties = extractMarketplacePropertiesFromTable(
    AMAZON_AUTOBRIDGE_TABLE_HTML,
  );
  const results = matchByPageContext(dataset, {
    url: AMAZON_TOYOTA_EXAMPLE_URL,
    hostname: "www.amazon.com.au",
    title: extractTitleTag(AMAZON_AUTOBRIDGE_HEAD_HTML),
    meta: {
      title: extractMetaContent(AMAZON_AUTOBRIDGE_HEAD_HTML, "title"),
      description: extractMetaContent(
        AMAZON_AUTOBRIDGE_HEAD_HTML,
        "description",
      ),
    },
    marketplaceProperties,
  });
  const ids = results.map((item) => item.PageID);

  assert.equal(results[0]?.PageID, "company-autobridge");
  assert.equal(ids.includes("company-toyota"), false);
});

import { matchingConfig } from "./matchingConfig.ts";
import extractAmazonMarketplacePropertiesByConvention from "./customExtractors/amazon.ts";
import type {
  CustomExtractorProperties,
  CustomMarketplaceExtractor,
} from "./customExtractors/types.ts";

const normalizeHost = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

const isDomainOrSubdomain = (hostname: string, domain: string): boolean => {
  const host = normalizeHost(hostname);
  const target = normalizeHost(domain);
  return host === target || host.endsWith(`.${target}`);
};

export const ECOMMERCE_DOMAINS = Object.keys(
  matchingConfig.ecommerceDomainFamilyMap,
);

const isHostInConfiguredDomainPrefixFamily = (
  hostname: string,
  domainPrefix: string,
): boolean => {
  return Object.keys(matchingConfig.ecommerceDomainFamilyMap).some((domain) => {
    const normalizedDomain = normalizeHost(domain);
    if (!normalizedDomain.startsWith(`${domainPrefix}.`)) return false;
    return isDomainOrSubdomain(hostname, normalizedDomain);
  });
};

export const getEcommerceFamily = (hostname: string): string | null => {
  const host = normalizeHost(hostname);
  const matchedDomain = ECOMMERCE_DOMAINS.find((domain) =>
    isDomainOrSubdomain(host, domain),
  );
  if (!matchedDomain) return null;
  return matchingConfig.ecommerceDomainFamilyMap[matchedDomain] ?? null;
};

export const isKnownEcommerceHost = (hostname: string): boolean => {
  return getEcommerceFamily(hostname) !== null;
};

export const isAmazonEcommerceHost = (hostname: string): boolean => {
  return isHostInConfiguredDomainPrefixFamily(hostname, "amazon");
};

export const isEbayEcommerceHost = (hostname: string): boolean => {
  return isHostInConfiguredDomainPrefixFamily(hostname, "ebay");
};

type MarketplaceProperties = Record<string, string>;
type MarketplaceExtractor = CustomMarketplaceExtractor;

type ImportMetaWithGlob = ImportMeta & {
  glob?: (
    pattern: string,
    options?: { eager?: boolean },
  ) => Record<string, unknown>;
};

const normalizePropertyValue = (value: string): string => {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractAmazonMarketplaceProperties = (
  doc: Document,
  hostname: string,
): MarketplaceProperties | undefined => {
  if (!isAmazonEcommerceHost(hostname)) return undefined;
  const extracted = extractAmazonMarketplacePropertiesByConvention(doc, hostname);
  return normalizeCustomMarketplaceProperties(extracted);
};

export const normalizeCustomMarketplaceProperties = (
  properties: CustomExtractorProperties | undefined,
): MarketplaceProperties | undefined => {
  if (!properties) return undefined;

  const normalized = {
    productName: normalizePropertyValue(properties.productName || ""),
    brandName: normalizePropertyValue(properties.brandName || ""),
    manufacturerName: normalizePropertyValue(properties.manufacturerName || ""),
  };

  const mapped = new Map<string, string>();
  if (normalized.productName) {
    mapped.set("schemaProductName", normalized.productName);
  }
  if (normalized.brandName) {
    mapped.set("brand", normalized.brandName);
    mapped.set("schemaProductBrand", normalized.brandName);
  }
  if (normalized.manufacturerName) {
    mapped.set("manufacturer", normalized.manufacturerName);
    mapped.set("schemaProductManufacturer", normalized.manufacturerName);
  }

  if (mapped.size === 0) return undefined;
  return Object.fromEntries(mapped.entries());
};

const getExtractorFamilyFromModulePath = (path: string): string | null => {
  const filename = path.split("/").pop();
  if (!filename) return null;
  if (!filename.endsWith(".ts")) return null;
  return filename.slice(0, -3).toLowerCase();
};

const getConventionCustomExtractorMap = (): Map<string, MarketplaceExtractor> => {
  const extractors = new Map<string, MarketplaceExtractor>();
  extractors.set("amazon", extractAmazonMarketplacePropertiesByConvention);

  const glob = (import.meta as ImportMetaWithGlob).glob;
  if (typeof glob !== "function") return extractors;

  const modules = glob("./customExtractors/*.ts", { eager: true });
  for (const [path, moduleValue] of Object.entries(modules)) {
    const family = getExtractorFamilyFromModulePath(path);
    if (!family) continue;
    if (!moduleValue || typeof moduleValue !== "object") continue;

    const candidate = (moduleValue as { default?: unknown }).default;
    if (typeof candidate !== "function") continue;
    extractors.set(family, candidate as MarketplaceExtractor);
  }

  return extractors;
};

const CUSTOM_MARKETPLACE_EXTRACTORS = getConventionCustomExtractorMap();

export const extractCustomMarketplaceProperties = (
  doc: Document,
  hostname: string,
): MarketplaceProperties | undefined => {
  const family = getEcommerceFamily(hostname);
  if (!family) return undefined;

  const extractor = CUSTOM_MARKETPLACE_EXTRACTORS.get(family.toLowerCase());
  if (!extractor) return undefined;
  const extracted = extractor(doc, hostname);
  return normalizeCustomMarketplaceProperties(extracted);
};

export const extractSchemaJsonLdProductProperties = (
  doc: Document,
  hostname: string,
): MarketplaceProperties | undefined => {
  void hostname;

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
    if (hasProductType(node["@type"])) {
      productNodes.push(node);
    }
    if (node["@graph"]) {
      collectProductNodes(node["@graph"]);
    }
  };
  const readLinkedName = (value: unknown): string => {
    if (typeof value === "string") return normalizePropertyValue(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const name = readLinkedName(item);
        if (name) return name;
      }
      return "";
    }
    if (!value || typeof value !== "object") return "";

    const node = value as Record<string, unknown>;
    if (typeof node.name === "string") {
      return normalizePropertyValue(node.name);
    }
    return "";
  };

  const scripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]'),
  );

  for (const script of scripts) {
    const text = (script.textContent || "").trim();
    if (!text) continue;

    try {
      const payload = JSON.parse(text) as unknown;
      collectProductNodes(payload);
    } catch {
      continue;
    }
  }

  if (productNodes.length === 0) return undefined;

  const properties = new Map<string, string>();
  for (const node of productNodes) {
    const name = readLinkedName(node.name);
    const brand = readLinkedName(node.brand);
    const manufacturer = readLinkedName(node.manufacturer);
    if (name && !properties.has("schemaProductName")) {
      properties.set("schemaProductName", name);
    }
    if (brand && !properties.has("schemaProductBrand")) {
      properties.set("schemaProductBrand", brand);
    }
    if (manufacturer && !properties.has("schemaProductManufacturer")) {
      properties.set("schemaProductManufacturer", manufacturer);
    }
    if (
      properties.has("schemaProductName") &&
      properties.has("schemaProductBrand") &&
      properties.has("schemaProductManufacturer")
    ) {
      break;
    }
  }

  if (properties.size === 0) return undefined;
  return Object.fromEntries(properties.entries());
};

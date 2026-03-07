import { matchingConfig } from "./matchingConfig.ts";

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

const normalizePropertyLabel = (value: string): string => {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[:\s]+/g, " ")
    .trim()
    .toLowerCase();
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
): Record<string, string> | undefined => {
  if (!isAmazonEcommerceHost(hostname)) return undefined;

  const properties = new Map<string, string>();
  const targetLabels = new Set(["brand", "manufacturer"]);
  const setProperty = (label: string, value: string) => {
    if (!targetLabels.has(label)) return;
    if (!value) return;
    if (properties.has(label)) return;
    properties.set(label, value);
  };

  for (const row of Array.from(doc.querySelectorAll("tr"))) {
    const cells = row.querySelectorAll("th, td");
    if (cells.length < 2) continue;
    const label = normalizePropertyLabel(cells[0]?.textContent || "");
    const value = normalizePropertyValue(cells[1]?.textContent || "");
    setProperty(label, value);
    if (properties.has("brand") && properties.has("manufacturer")) break;
  }

  if (!properties.has("brand") || !properties.has("manufacturer")) {
    for (const listItem of Array.from(doc.querySelectorAll("li"))) {
      const text = normalizePropertyValue(listItem.textContent || "");
      if (!text.includes(":")) continue;
      const [rawLabel, ...rest] = text.split(":");
      if (!rawLabel || rest.length === 0) continue;
      const label = normalizePropertyLabel(rawLabel);
      const value = normalizePropertyValue(rest.join(":"));
      setProperty(label, value);
      if (properties.has("brand") && properties.has("manufacturer")) break;
    }
  }

  if (properties.size === 0) return undefined;
  return Object.fromEntries(properties.entries());
};

export const extractEbayJsonLdProductProperties = (
  doc: Document,
  hostname: string,
): Record<string, string> | undefined => {
  if (!isEbayEcommerceHost(hostname)) return undefined;

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
    const brand = readLinkedName(node.brand);
    const manufacturer = readLinkedName(node.manufacturer);
    if (brand && !properties.has("schemaProductBrand")) {
      properties.set("schemaProductBrand", brand);
    }
    if (manufacturer && !properties.has("schemaProductManufacturer")) {
      properties.set("schemaProductManufacturer", manufacturer);
    }
    if (
      properties.has("schemaProductBrand") &&
      properties.has("schemaProductManufacturer")
    ) {
      break;
    }
  }

  if (properties.size === 0) return undefined;
  return Object.fromEntries(properties.entries());
};

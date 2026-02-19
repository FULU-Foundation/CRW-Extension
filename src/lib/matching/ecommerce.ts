import { matchingConfig } from "./matchingConfig.ts";

const normalizeHost = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

const isDomainOrSubdomain = (hostname: string, domain: string): boolean => {
  const host = normalizeHost(hostname);
  const target = normalizeHost(domain);
  return host === target || host.endsWith(`.${target}`);
};

export const ECOMMERCE_DOMAIN_FAMILY_MAP = matchingConfig.ecommerceDomainFamilyMap;
export const ECOMMERCE_DOMAINS = Object.keys(
  matchingConfig.ecommerceDomainFamilyMap,
);

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

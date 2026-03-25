import { getDomain } from "tldts";

export const normalizeHostname = (hostname: string): string => {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
};

export const getSiteScopeHostname = (hostname: string): string => {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return "";

  const registrableDomain = getDomain(normalized, {
    allowPrivateDomains: true,
  });
  if (registrableDomain) return registrableDomain;

  return normalized;
};

export const hostnameMatchesSiteScope = (
  hostname: string,
  siteScope: string,
): boolean => {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedSiteScope = normalizeHostname(siteScope);
  if (!normalizedHostname || !normalizedSiteScope) return false;

  return (
    normalizedHostname === normalizedSiteScope ||
    normalizedHostname.endsWith(`.${normalizedSiteScope}`)
  );
};

export const normalizeSiteScopeList = (values: string[]): string[] => {
  const normalizedValues = values
    .map((value) => normalizeHostname(value))
    .filter((value) => value.length > 0);

  return [...new Set(normalizedValues)];
};

export const canonicalizeSiteScopeList = (values: string[]): string[] => {
  const normalizedValues = values
    .map((value) => getSiteScopeHostname(value))
    .filter((value) => value.length > 0);

  return [...new Set(normalizedValues)];
};

export const isHostnameInSiteScopeList = (
  hostname: string,
  siteScopes: string[],
): boolean => {
  return siteScopes.some((siteScope) =>
    hostnameMatchesSiteScope(hostname, siteScope),
  );
};

export const removeMatchingSiteScopes = (
  siteScopes: string[],
  hostname: string,
): string[] => {
  return canonicalizeSiteScopeList(siteScopes).filter(
    (siteScope) => !hostnameMatchesSiteScope(hostname, siteScope),
  );
};

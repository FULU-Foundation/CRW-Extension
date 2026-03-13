import type { CargoEntry } from "@/shared/types";
import { getDomain, parse } from "tldts";
import type { UrlEntryMatch, UrlMatchDetail, UrlMatchType } from "./types";
import { getEcommerceFamily } from "./ecommerce.ts";
import { matchingConfig } from "./matchingConfig.ts";

const MATCH_PRIORITY: Record<UrlMatchType, number> = {
  exact: 3,
  partial: 2,
  subdomain: 1,
};

export const safeParseUrl = (rawUrl: string | null | undefined): URL | null => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
};

export const normalizePath = (pathname: string): string => {
  const clean = pathname.replace(/\/{2,}/g, "/");
  if (clean === "/") return "/";
  return clean.replace(/\/+$/, "");
};

export const getDomainRoot = (hostname: string): string => {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  const registrableDomain = getDomain(normalized, {
    allowPrivateDomains: true,
  });
  if (registrableDomain) return registrableDomain;

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  return parts.slice(-2).join(".");
};

const getCrossTldAliasKey = (hostname: string): string | null => {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  const parsed = parse(normalized, { allowPrivateDomains: true });
  if (!parsed.domainWithoutSuffix || !parsed.publicSuffix) return null;
  return `${parsed.domainWithoutSuffix}|${parsed.publicSuffix}`;
};

const isLikelyMarketCountryCodeSuffix = (suffix: string): boolean => {
  const parts = suffix.toLowerCase().split(".").filter(Boolean);
  if (parts.length !== 2) return false;

  const [secondLevel, countryCode] = parts;
  const marketLabels = new Set(
    matchingConfig.crossTldAliasMarketSecondLevelLabels.map((value) =>
      value.toLowerCase(),
    ),
  );
  return countryCode.length === 2 && marketLabels.has(secondLevel);
};

const isEligibleCrossTldAliasPair = (
  visitedSuffix: string,
  candidateSuffix: string,
): boolean => {
  const globalSuffixes = new Set(
    matchingConfig.crossTldAliasGlobalSuffixes.map((value) =>
      value.toLowerCase(),
    ),
  );
  if (
    isLikelyMarketCountryCodeSuffix(visitedSuffix) &&
    isLikelyMarketCountryCodeSuffix(candidateSuffix)
  ) {
    return true;
  }

  return (
    (isLikelyMarketCountryCodeSuffix(visitedSuffix) &&
      globalSuffixes.has(candidateSuffix)) ||
    (isLikelyMarketCountryCodeSuffix(candidateSuffix) &&
      globalSuffixes.has(visitedSuffix))
  );
};

const normalizeMatchHostname = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

export const classifyUrlMatch = (
  visitedUrl: URL,
  candidateUrl: URL,
): UrlMatchDetail | null => {
  const visitedHost = normalizeMatchHostname(visitedUrl.hostname);
  const candidateHost = normalizeMatchHostname(candidateUrl.hostname);
  const visitedPath = normalizePath(visitedUrl.pathname);
  const candidatePath = normalizePath(candidateUrl.pathname);

  if (visitedHost === candidateHost) {
    if (visitedPath === candidatePath) {
      return {
        matchType: "exact",
        matchedPath: candidatePath,
        visitedHost,
        candidateHost,
      };
    }

    const prefix = candidatePath === "/" ? "/" : `${candidatePath}/`;
    if (visitedPath.startsWith(prefix)) {
      return {
        matchType: "partial",
        matchedPath: candidatePath,
        visitedHost,
        candidateHost,
      };
    }
  }

  if (matchingConfig.enableSubdomainMatching) {
    if (
      getDomainRoot(visitedHost) === getDomainRoot(candidateHost) &&
      visitedHost !== candidateHost
    ) {
      return {
        matchType: "subdomain",
        matchedPath: null,
        visitedHost,
        candidateHost,
      };
    }
  }

  if (matchingConfig.enableEcommerceFamilyAliasMatching) {
    const visitedFamily = getEcommerceFamily(visitedHost);
    const candidateFamily = getEcommerceFamily(candidateHost);
    if (visitedFamily && candidateFamily && visitedFamily === candidateFamily) {
      return {
        matchType: "subdomain",
        matchedPath: null,
        visitedHost,
        candidateHost,
        ecommerceFamilyAlias: true,
      };
    }
  }

  if (matchingConfig.enableMatchAcrossTLDs) {
    const visitedAliasKey = getCrossTldAliasKey(visitedHost);
    const candidateAliasKey = getCrossTldAliasKey(candidateHost);
    const visitedRoot = getDomainRoot(visitedHost);
    const candidateRoot = getDomainRoot(candidateHost);
    const [visitedLabel, visitedSuffix] = visitedAliasKey?.split("|") ?? [];
    const [candidateLabel, candidateSuffix] =
      candidateAliasKey?.split("|") ?? [];
    if (
      visitedLabel &&
      candidateLabel &&
      visitedSuffix &&
      candidateSuffix &&
      visitedLabel === candidateLabel &&
      isEligibleCrossTldAliasPair(visitedSuffix, candidateSuffix) &&
      visitedRoot !== candidateRoot
    ) {
      return {
        matchType: "subdomain",
        matchedPath: null,
        visitedHost,
        candidateHost,
        crossTldAlias: true,
      };
    }
  }

  return null;
};

export const scoreUrlMatch = (detail: UrlMatchDetail): number => {
  const base = MATCH_PRIORITY[detail.matchType] * 1000;
  if (detail.matchType === "partial") {
    return base + (detail.matchedPath?.length ?? 0);
  }
  return base;
};

const getMatchReasons = (detail: UrlMatchDetail): string[] => {
  if (detail.matchType === "exact") return ["host_equal", "path_equal"];
  if (detail.matchType === "partial") return ["host_equal", "path_prefix"];
  if (detail.ecommerceFamilyAlias) {
    return ["ecommerce_family_alias", "subdomain_match"];
  }
  if (detail.crossTldAlias) {
    return ["cross_tld_alias", "subdomain_match"];
  }
  return ["root_domain_equal", "subdomain_match"];
};

type DetailedUrlEntryMatch = {
  entry: CargoEntry;
  detail: UrlMatchDetail;
  score: number;
  reasons: string[];
};

const getSubdomainDepth = (hostname: string): number => {
  const hostSegments = hostname.split(".").filter(Boolean).length;
  const rootSegments = getDomainRoot(hostname)
    .split(".")
    .filter(Boolean).length;
  return Math.max(0, hostSegments - rootSegments);
};

const compareSubdomainDepth = (
  left: UrlMatchDetail,
  right: UrlMatchDetail,
): number => {
  if (left.matchType !== "subdomain" || right.matchType !== "subdomain") {
    return 0;
  }

  const leftDepth = getSubdomainDepth(left.candidateHost);
  const rightDepth = getSubdomainDepth(right.candidateHost);
  return leftDepth - rightDepth;
};

const sortDetailedMatches = (
  left: DetailedUrlEntryMatch,
  right: DetailedUrlEntryMatch,
): number => {
  if (right.score !== left.score) return right.score - left.score;

  const byDepth = compareSubdomainDepth(left.detail, right.detail);
  if (byDepth !== 0) return byDepth;

  const byName = left.entry.PageName.localeCompare(right.entry.PageName);
  if (byName !== 0) return byName;
  return left.entry.PageID.localeCompare(right.entry.PageID);
};

const splitWebsiteUrls = (website: unknown): string[] => {
  if (typeof website !== "string") return [];

  const values: string[] = [];
  const seen = new Set<string>();
  const pushIfUnique = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    values.push(trimmed);
  };

  const mediaWikiLinkPattern =
    /\[((?:https?:\/\/|www\.)[^\s\]]+)(?:\s+([^\]]+))?\]/gi;

  const remaining = website.replace(
    mediaWikiLinkPattern,
    (_match, target: string, label: string | undefined) => {
      pushIfUnique(target);

      const labelTrimmed = label?.trim() ?? "";
      if (/^(?:https?:\/\/|www\.)/i.test(labelTrimmed)) {
        pushIfUnique(labelTrimmed);
      }

      return " ";
    },
  );

  for (const value of remaining
    .split(/,(?=\s*(?:https?:\/\/|www\.))|\s+(?=(?:https?:\/\/|www\.))/i)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)) {
    pushIfUnique(value);
  }

  return values;
};

const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const isSpecificPathDomainMatchEnabled = (candidateHost: string): boolean => {
  return matchingConfig.specificPathDomainMatches.includes(candidateHost);
};

const filterToMostSpecificPathMatches = (
  matches: DetailedUrlEntryMatch[],
): DetailedUrlEntryMatch[] => {
  const deepestPathLengthByHost = new Map<string, number>();

  for (const match of matches) {
    if (!isSpecificPathDomainMatchEnabled(match.detail.candidateHost)) continue;
    if (
      (match.detail.matchType !== "exact" &&
        match.detail.matchType !== "partial") ||
      !match.detail.matchedPath
    ) {
      continue;
    }

    const current =
      deepestPathLengthByHost.get(match.detail.candidateHost) ?? 0;
    const next = match.detail.matchedPath.length;
    if (next > current)
      deepestPathLengthByHost.set(match.detail.candidateHost, next);
  }

  return matches.filter((match) => {
    if (!isSpecificPathDomainMatchEnabled(match.detail.candidateHost))
      return true;
    if (
      (match.detail.matchType !== "exact" &&
        match.detail.matchType !== "partial") ||
      !match.detail.matchedPath
    ) {
      return true;
    }
    const deepest = deepestPathLengthByHost.get(match.detail.candidateHost);
    if (typeof deepest !== "number") return true;
    return match.detail.matchedPath.length >= deepest;
  });
};

export const matchEntriesByUrl = (
  entries: CargoEntry[],
  visitedUrlRaw: string,
  limit = 3,
): UrlEntryMatch[] => {
  const visitedUrl = safeParseUrl(visitedUrlRaw);
  if (!visitedUrl) return [];

  const matches: DetailedUrlEntryMatch[] = [];
  for (const entry of entries) {
    const websiteUrls = splitWebsiteUrls(entry?.Website);

    for (const websiteUrl of websiteUrls) {
      const candidateUrl = safeParseUrl(websiteUrl);
      if (!candidateUrl) continue;

      const detail = classifyUrlMatch(visitedUrl, candidateUrl);
      if (!detail) continue;

      matches.push({
        entry,
        detail,
        score: scoreUrlMatch(detail),
        reasons: getMatchReasons(detail),
      });
    }
  }

  const bestMatchByEntry = new Map<string, DetailedUrlEntryMatch>();
  for (const match of filterToMostSpecificPathMatches(matches)) {
    const key = getEntryKey(match.entry);
    const existing = bestMatchByEntry.get(key);
    if (!existing || sortDetailedMatches(match, existing) < 0) {
      bestMatchByEntry.set(key, match);
    }
  }

  const pruned = Array.from(bestMatchByEntry.values());
  pruned.sort(sortDetailedMatches);

  return pruned.slice(0, limit).map((match) => ({
    entry: match.entry,
    matchType: match.detail.matchType,
    matchedPath: match.detail.matchedPath,
    score: match.score,
    reasons: match.reasons,
  }));
};

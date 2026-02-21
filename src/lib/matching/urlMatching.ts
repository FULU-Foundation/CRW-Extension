import type { CargoEntry } from "@/shared/types";
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
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  return parts.slice(-2).join(".");
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

  return null;
};

export const scoreUrlMatch = (detail: UrlMatchDetail): number => {
  const base = MATCH_PRIORITY[detail.matchType] * 1000;
  if (detail.matchType === "partial") {
    return base + (detail.matchedPath?.length ?? 0);
  }
  return base;
};

const sortMatches = (left: UrlEntryMatch, right: UrlEntryMatch): number => {
  if (right.score !== left.score) return right.score - left.score;
  const byName = left.entry.PageName.localeCompare(right.entry.PageName);
  if (byName !== 0) return byName;
  return left.entry.PageID.localeCompare(right.entry.PageID);
};

const getMatchReasons = (detail: UrlMatchDetail): string[] => {
  if (detail.matchType === "exact") return ["host_equal", "path_equal"];
  if (detail.matchType === "partial") return ["host_equal", "path_prefix"];
  if (detail.ecommerceFamilyAlias) {
    return ["ecommerce_family_alias", "subdomain_match"];
  }
  return ["root_domain_equal", "subdomain_match"];
};

type DetailedUrlEntryMatch = {
  entry: CargoEntry;
  detail: UrlMatchDetail;
  score: number;
  reasons: string[];
};

const GITHUB_HOST = "github.com";

const filterToMostSpecificPathMatches = (
  matches: DetailedUrlEntryMatch[],
): DetailedUrlEntryMatch[] => {
  const deepestPathLengthByHost = new Map<string, number>();

  for (const match of matches) {
    if (match.detail.candidateHost !== GITHUB_HOST) continue;
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
    if (match.detail.candidateHost !== GITHUB_HOST) return true;
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
    const candidateUrl = safeParseUrl(entry?.Website);
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

  const pruned = filterToMostSpecificPathMatches(matches).map((match) => ({
    entry: match.entry,
    matchType: match.detail.matchType,
    matchedPath: match.detail.matchedPath,
    score: match.score,
    reasons: match.reasons,
  }));

  pruned.sort(sortMatches);
  return pruned.slice(0, limit);
};

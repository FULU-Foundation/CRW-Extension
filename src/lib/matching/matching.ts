import type { CargoEntry, PageContext } from "@/shared/types";
import { expandRelatedEntries } from "./relations.ts";
import { matchEntriesByUrl } from "./urlMatching.ts";
import { matchEntriesByPageContext } from "./pageContextMatching.ts";
import { isKnownEcommerceHost } from "./ecommerce.ts";
import type { UrlEntryMatch } from "./types.ts";

export type { UrlEntryMatch, UrlMatchDetail, UrlMatchType } from "./types.ts";
export {
  classifyUrlMatch,
  getDomainRoot,
  matchEntriesByUrl,
  normalizePath,
  safeParseUrl,
  scoreUrlMatch,
} from "./urlMatching.ts";
export { expandRelatedEntries } from "./relations.ts";
export { matchEntriesByPageContext } from "./pageContextMatching.ts";
export { isKnownEcommerceHost } from "./ecommerce.ts";

export const matchByUrl = (
  entries: CargoEntry[],
  url: string,
): CargoEntry[] => {
  const seedEntries = matchEntriesByUrl(entries, url, 3).map(
    (match) => match.entry,
  );
  return expandRelatedEntries(entries, seedEntries);
};

const dedupeSeeds = (entries: CargoEntry[]): CargoEntry[] => {
  const unique = new Map<string, CargoEntry>();
  for (const entry of entries) {
    const key = `${entry._type}:${entry.PageID}`;
    if (!unique.has(key)) unique.set(key, entry);
  }
  return Array.from(unique.values());
};

const entryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const hasWebsite = (entry: CargoEntry): boolean => {
  return typeof entry.Website === "string" && entry.Website.trim().length > 0;
};

const prioritizePageContextSeeds = (
  urlMatches: UrlEntryMatch[],
  metaSeeds: CargoEntry[],
): CargoEntry[] => {
  const urlSeeds = urlMatches.map((match) => match.entry);
  const hasCompanyUrlSeed = urlSeeds.some((entry) => entry._type === "Company");

  const exactSpecificUrlSeeds = urlMatches
    .filter(
      (match) =>
        match.matchType === "exact" &&
        match.entry._type !== "Company" &&
        hasWebsite(match.entry),
    )
    .map((match) => match.entry);

  const promotedMetaSeeds = hasCompanyUrlSeed
    ? metaSeeds.filter((entry) => entry._type !== "Company")
    : [];
  const promotedMetaKeys = new Set(promotedMetaSeeds.map(entryKey));
  const remainingMetaSeeds = metaSeeds.filter(
    (entry) => !promotedMetaKeys.has(entryKey(entry)),
  );

  return dedupeSeeds([
    ...exactSpecificUrlSeeds,
    ...promotedMetaSeeds,
    ...remainingMetaSeeds,
    ...urlSeeds,
  ]);
};

export const matchByPageContext = (
  entries: CargoEntry[],
  context: PageContext,
): CargoEntry[] => {
  const urlMatches = matchEntriesByUrl(entries, context.url, 3);
  const metaSeeds = matchEntriesByPageContext(entries, context, 5);
  const isEcommerceHost = isKnownEcommerceHost(context.hostname || "");

  if (urlMatches.length === 0) {
    if (!isEcommerceHost || metaSeeds.length === 0) return [];
    return expandRelatedEntries(entries, dedupeSeeds(metaSeeds));
  }

  const prioritizedSeeds = prioritizePageContextSeeds(urlMatches, metaSeeds);
  return expandRelatedEntries(entries, prioritizedSeeds);
};

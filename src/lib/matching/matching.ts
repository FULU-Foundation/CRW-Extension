import type { CargoEntry, PageContext } from "@/shared/types";
import { expandRelatedEntries } from "./relations.ts";
import { matchEntriesByUrl } from "./urlMatching.ts";
import { matchEntriesByPageContext } from "./pageContextMatching.ts";
import { isKnownEcommerceHost } from "./ecommerce.ts";

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

export const matchByPageContext = (
  entries: CargoEntry[],
  context: PageContext,
): CargoEntry[] => {
  const hostname = context.hostname || "";
  const isEcommerce = isKnownEcommerceHost(hostname);

  if (isEcommerce) {
    const metaSeeds = matchEntriesByPageContext(entries, context, 5);
    if (metaSeeds.length === 0) return [];

    const urlSeeds = matchEntriesByUrl(entries, context.url, 3).map(
      (match) => match.entry,
    );
    return expandRelatedEntries(entries, dedupeSeeds([...metaSeeds, ...urlSeeds]));
  }

  return matchByUrl(entries, context.url);
};

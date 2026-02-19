import type { CargoEntry } from "@/shared/types";
import { expandRelatedEntries } from "./relations.ts";
import { matchEntriesByUrl } from "./urlMatching.ts";

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

export const matchByUrl = (
  entries: CargoEntry[],
  url: string,
): CargoEntry[] => {
  const seedEntries = matchEntriesByUrl(entries, url, 3).map(
    (match) => match.entry,
  );
  return expandRelatedEntries(entries, seedEntries);
};

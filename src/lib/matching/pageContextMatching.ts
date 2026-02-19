import type { CargoEntry, PageContext } from "@/shared/types";

type TextMatch = {
  entry: CargoEntry;
  score: number;
};

const MARKETPLACE_BRANDS = new Set(["amazon", "ebay"]);

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const containsWholePhrase = (haystack: string, needle: string): boolean => {
  const haystackTokens = haystack.split(" ").filter(Boolean);
  const needleTokens = needle.split(" ").filter(Boolean);
  if (haystackTokens.length === 0 || needleTokens.length === 0) return false;
  if (needleTokens.length > haystackTokens.length) return false;

  for (let index = 0; index <= haystackTokens.length - needleTokens.length; index += 1) {
    let isMatch = true;
    for (let offset = 0; offset < needleTokens.length; offset += 1) {
      if (haystackTokens[index + offset] !== needleTokens[offset]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) return true;
  }
  return false;
};

const phraseScore = (haystack: string, needle: string): number => {
  if (!haystack || !needle) return 0;
  if (!containsWholePhrase(haystack, needle)) return 0;

  const words = needle.split(" ").filter(Boolean).length;
  return Math.max(1, words);
};

const typeBoost = (entry: CargoEntry): number => {
  if (entry._type === "Company") return 3;
  if (entry._type === "ProductLine") return 4;
  if (entry._type === "Product") return 4;
  return 0;
};

const rankMatches = (matches: TextMatch[], limit: number): CargoEntry[] => {
  matches.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const byType = left.entry._type.localeCompare(right.entry._type);
    if (byType !== 0) return byType;
    const byName = left.entry.PageName.localeCompare(right.entry.PageName);
    if (byName !== 0) return byName;
    return left.entry.PageID.localeCompare(right.entry.PageID);
  });

  const deduped: CargoEntry[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    const key = `${match.entry._type}:${match.entry.PageID}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(match.entry);
    if (deduped.length >= limit) break;
  }
  return deduped;
};

export const matchEntriesByPageContext = (
  entries: CargoEntry[],
  context: PageContext,
  limit = 5,
): CargoEntry[] => {
  const title = normalizeText(context.title || "");
  const metaTitle = normalizeText(context.meta?.title || "");
  const description = normalizeText(context.meta?.description || "");
  const ogTitle = normalizeText(context.meta?.["og:title"] || "");
  const ogDescription = normalizeText(context.meta?.["og:description"] || "");
  const canonicalText = `${title} ${metaTitle} ${description} ${ogTitle} ${ogDescription}`.trim();
  if (!canonicalText) return [];

  const matches: TextMatch[] = [];

  for (const entry of entries) {
    if (entry._type === "Incident") continue;

    const pageName = normalizeText(entry.PageName || "");
    if (pageName.length < 3) continue;
    if (MARKETPLACE_BRANDS.has(pageName)) continue;

    const titleHit = phraseScore(title, pageName);
    const metaTitleHit = phraseScore(metaTitle, pageName);
    const descriptionHit = phraseScore(description, pageName);
    const ogTitleHit = phraseScore(ogTitle, pageName);
    const ogDescriptionHit = phraseScore(ogDescription, pageName);
    if (
      titleHit === 0 &&
      metaTitleHit === 0 &&
      descriptionHit === 0 &&
      ogTitleHit === 0 &&
      ogDescriptionHit === 0
    ) {
      continue;
    }

    const score =
      titleHit * 10 +
      metaTitleHit * 9 +
      descriptionHit * 6 +
      ogTitleHit * 9 +
      ogDescriptionHit * 6 +
      typeBoost(entry) +
      pageName.length;

    matches.push({
      entry,
      score,
    });
  }

  return rankMatches(matches, limit);
};

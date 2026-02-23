import type { CargoEntry, CargoEntryType } from "../src/shared/types.ts";
import { DATA_REMOTE_URL, DATASET_KEYS } from "../src/shared/constants.ts";
import { decodeEntityStrings } from "../src/shared/html.ts";
import {
  matchEntriesByUrl,
  safeParseUrl,
} from "../src/lib/matching/matching.ts";

type RawDataset = Record<string, unknown>;

type UrlCheckFailure = {
  kind: "invalid_url" | "no_self_match";
  url: string;
  topMatches: string[];
};

type EntryFailure = {
  entry: CargoEntry;
  failures: UrlCheckFailure[];
};

const flattenDataset = (raw: RawDataset): CargoEntry[] => {
  const rows: CargoEntry[] = [];

  for (const section of DATASET_KEYS) {
    const list = raw[section];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      const decoded = decodeEntityStrings(item) as Record<string, unknown>;
      rows.push({
        ...decoded,
        _type: section as CargoEntryType,
      } as CargoEntry);
    }
  }

  return rows;
};

const splitWebsiteField = (website: unknown): string[] => {
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

const entryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const formatMatchLabel = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID} ${entry.PageName}`;
};

const fetchDataset = async (): Promise<RawDataset> => {
  const response = await fetch(DATA_REMOTE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset (${response.status})`);
  }

  return (await response.json()) as RawDataset;
};

const verifyEntryUrls = (
  entry: CargoEntry,
  dataset: CargoEntry[],
): EntryFailure | null => {
  const urls = splitWebsiteField(entry.Website);
  if (urls.length === 0) return null;

  const selfKey = entryKey(entry);
  const failures: UrlCheckFailure[] = [];

  for (const url of urls) {
    const parsed = safeParseUrl(url);
    if (!parsed) {
      failures.push({
        kind: "invalid_url",
        url,
        topMatches: [],
      });
      continue;
    }

    const matches = matchEntriesByUrl(
      dataset,
      parsed.toString(),
      Number.MAX_SAFE_INTEGER,
    );
    const hasSelfMatch = matches.some((match) => entryKey(match.entry) === selfKey);

    if (!hasSelfMatch) {
      failures.push({
        kind: "no_self_match",
        url: parsed.toString(),
        topMatches: matches
          .slice(0, 3)
          .map((match) => formatMatchLabel(match.entry)),
      });
    }
  }

  if (failures.length === 0) return null;
  return { entry, failures };
};

const run = async () => {
  console.log(`Fetching Cargo dataset from ${DATA_REMOTE_URL}`);
  const raw = await fetchDataset();
  const dataset = flattenDataset(raw);

  let entriesWithWebsite = 0;
  let urlsChecked = 0;
  const failures: EntryFailure[] = [];

  for (const entry of dataset) {
    const urls = splitWebsiteField(entry.Website);
    if (urls.length === 0) continue;

    entriesWithWebsite += 1;
    urlsChecked += urls.length;

    const failure = verifyEntryUrls(entry, dataset);
    if (failure) failures.push(failure);
  }

  const invalidUrlCount = failures.reduce((count, failure) => {
    return (
      count +
      failure.failures.filter((item) => item.kind === "invalid_url").length
    );
  }, 0);
  const noMatchCount = failures.reduce((count, failure) => {
    return (
      count +
      failure.failures.filter((item) => item.kind === "no_self_match").length
    );
  }, 0);

  console.log("");
  console.log(`Dataset entries: ${dataset.length}`);
  console.log(`Entries with Website: ${entriesWithWebsite}`);
  console.log(`Website URLs checked: ${urlsChecked}`);
  console.log(`Entries with failures: ${failures.length}`);
  console.log(`Invalid URL values: ${invalidUrlCount}`);
  console.log(`URLs without self-match: ${noMatchCount}`);

  if (failures.length === 0) {
    console.log("");
    console.log("All Cargo Website URLs matched their own entries.");
    return;
  }

  console.log("");
  console.log("Cargo entries with unmatched or invalid Website URLs:");

  for (const failure of failures) {
    console.log("");
    console.log(
      `- ${failure.entry._type}:${failure.entry.PageID} ${failure.entry.PageName}`,
    );
    console.log(`  Website: ${String(failure.entry.Website ?? "")}`);

    for (const item of failure.failures) {
      if (item.kind === "invalid_url") {
        console.log(`  [invalid_url] ${item.url}`);
        continue;
      }

      const topMatches =
        item.topMatches.length > 0 ? item.topMatches.join(" | ") : "(none)";
      console.log(`  [no_self_match] ${item.url}`);
      console.log(`    top matches: ${topMatches}`);
    }
  }

  process.exitCode = 1;
};

void run();

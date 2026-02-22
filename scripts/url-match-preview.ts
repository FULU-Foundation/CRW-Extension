import type { CargoEntry, CargoEntryType } from "../src/shared/types.ts";
import { DATA_REMOTE_URL } from "../src/shared/constants.ts";
import {
  expandRelatedEntries,
  matchEntriesByUrl,
  safeParseUrl,
} from "../src/lib/matching/matching.ts";
import type { UrlEntryMatch } from "../src/lib/matching/matching.ts";
const DATASET_SECTIONS: CargoEntryType[] = [
  "Company",
  "Incident",
  "Product",
  "ProductLine",
];

const flattenDataset = (raw: Record<string, unknown>): CargoEntry[] => {
  const rows: CargoEntry[] = [];
  for (const section of DATASET_SECTIONS) {
    const list = raw[section];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      rows.push({
        ...(item as Record<string, unknown>),
        _type: section,
      } as CargoEntry);
    }
  }

  return rows;
};

const getCargoExampleUrls = (
  dataset: CargoEntry[],
  maxExamples: number,
): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const entry of dataset) {
    const parsed = safeParseUrl(entry?.Website);
    if (!parsed) continue;

    const normalized = parsed.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  urls.sort((a, b) => a.localeCompare(b));
  return urls.slice(0, maxExamples);
};

const toTableRows = (matches: UrlEntryMatch[]) => {
  return matches.map((m) => ({
    score: m.score,
    matchType: m.matchType,
    type: m.entry._type,
    pageName: m.entry.PageName,
    website: m.entry.Website ?? "-",
    matchedPath: m.matchedPath ?? "-",
  }));
};

const toRelationRows = (expanded: CargoEntry[], seedIds: Set<string>) => {
  return expanded.map((entry) => ({
    source: seedIds.has(entry.PageID) ? "seed" : "related",
    type: entry._type,
    pageId: entry.PageID,
    pageName: entry.PageName,
    company: entry.Company ?? "-",
    product: entry.Product ?? "-",
    productLine: entry.ProductLine ?? "-",
    website: entry.Website ?? "-",
  }));
};

const fetchDataset = async (): Promise<Record<string, unknown>> => {
  const response = await fetch(DATA_REMOTE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset (${response.status})`);
  }

  return (await response.json()) as Record<string, unknown>;
};

const run = async () => {
  const [, , urlArg, ...rest] = process.argv;
  const runExamples = !urlArg || urlArg === "--examples";

  const limitArg = rest.find((arg) => arg.startsWith("--limit="));
  const limit = Number(limitArg?.split("=")[1] || 20);
  const maxExamplesArg = rest.find((arg) => arg.startsWith("--max-examples="));
  const maxExamples = Number(maxExamplesArg?.split("=")[1] || 25);
  const relationLimitArg = rest.find((arg) =>
    arg.startsWith("--relations-limit="),
  );
  const relationLimit = Number(relationLimitArg?.split("=")[1] || 50);

  const raw = await fetchDataset();
  const dataset = flattenDataset(raw);
  const urls = runExamples ? getCargoExampleUrls(dataset, maxExamples) : [urlArg];

  if (runExamples) {
    console.log(
      `Running ${urls.length} URL examples from Cargo Website fields:`,
    );
    for (const example of urls) console.log(`- ${example}`);
    console.log("");
  }

  for (const url of urls) {
    const parsed = safeParseUrl(url);
    if (!parsed) {
      console.error(`Invalid URL: ${url}`);
      continue;
    }

    const matches = matchEntriesByUrl(dataset, parsed.toString(), limit);
    const seedEntries = matches.map((match) => match.entry);
    const expanded = expandRelatedEntries(dataset, seedEntries);
    const seedIds = new Set(seedEntries.map((entry) => entry.PageID));

    console.log(`Visited URL: ${parsed.toString()}`);
    console.log(`Seed matches: ${matches.length}`);
    console.log(`Expanded related entries: ${expanded.length}`);
    console.log("");
    console.log("Seed Matches");
    console.table(toTableRows(matches));
    console.log("Related Expansion");
    console.table(toRelationRows(expanded.slice(0, relationLimit), seedIds));
    console.log("");
  }
};

void run();

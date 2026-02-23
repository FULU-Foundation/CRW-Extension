import type { CargoEntry, CargoEntryType } from "../src/shared/types.ts";
import { DATA_REMOTE_URL, DATASET_KEYS } from "../src/shared/constants.ts";
import { decodeEntityStrings } from "../src/shared/html.ts";
import { matchEntriesByUrl, safeParseUrl } from "../src/lib/matching/matching.ts";
import type { UrlEntryMatch } from "../src/lib/matching/matching.ts";
import {
  resetMatchingConfig,
  setMatchingConfig,
} from "../src/lib/matching/matchingConfig.ts";

type RawDataset = Record<string, unknown>;

type MatchSnapshot = {
  key: string;
  label: string;
  matchType: UrlEntryMatch["matchType"];
  matchedPath: string | null;
  score: number;
  rank: number;
};

type MatchDiff = {
  url: string;
  disabled: MatchSnapshot[];
  enabled: MatchSnapshot[];
  added: MatchSnapshot[];
  removed: MatchSnapshot[];
  changed: Array<{
    key: string;
    before: MatchSnapshot;
    after: MatchSnapshot;
  }>;
  topMatchChanged: boolean;
};

type Summary = {
  urlsChecked: number;
  urlsChanged: number;
  topMatchChanges: number;
  addedMatches: number;
  removedMatches: number;
  changedMatches: number;
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
    .map((part) => part.trim())
    .filter((part) => part.length > 0)) {
    pushIfUnique(value);
  }

  return values;
};

const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const getEntryLabel = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID} ${entry.PageName}`;
};

const fetchDataset = async (): Promise<RawDataset> => {
  const response = await fetch(DATA_REMOTE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset (${response.status})`);
  }

  return (await response.json()) as RawDataset;
};

const collectCargoUrls = (dataset: CargoEntry[]): string[] => {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const entry of dataset) {
    for (const raw of splitWebsiteField(entry.Website)) {
      const parsed = safeParseUrl(raw);
      if (!parsed) continue;
      const normalized = parsed.toString();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      values.push(normalized);
    }
  }

  values.sort((left, right) => left.localeCompare(right));
  return values;
};

const snapshotMatches = (matches: UrlEntryMatch[]): MatchSnapshot[] => {
  return matches.map((match, index) => ({
    key: getEntryKey(match.entry),
    label: getEntryLabel(match.entry),
    matchType: match.matchType,
    matchedPath: match.matchedPath,
    score: match.score,
    rank: index + 1,
  }));
};

const runWithSubdomainSetting = (
  dataset: CargoEntry[],
  url: string,
  limit: number,
  enabled: boolean,
): MatchSnapshot[] => {
  setMatchingConfig({ enableSubdomainMatching: enabled });
  const matches = matchEntriesByUrl(dataset, url, limit);
  return snapshotMatches(matches);
};

const compareSnapshots = (
  url: string,
  disabled: MatchSnapshot[],
  enabled: MatchSnapshot[],
): MatchDiff => {
  const disabledByKey = new Map(disabled.map((item) => [item.key, item]));
  const enabledByKey = new Map(enabled.map((item) => [item.key, item]));

  const added = enabled.filter((item) => !disabledByKey.has(item.key));
  const removed = disabled.filter((item) => !enabledByKey.has(item.key));
  const changed = enabled
    .filter((item) => disabledByKey.has(item.key))
    .map((after) => {
      const before = disabledByKey.get(after.key);
      if (!before) return null;
      const isDifferent =
        before.matchType !== after.matchType ||
        before.matchedPath !== after.matchedPath ||
        before.score !== after.score ||
        before.rank !== after.rank;
      if (!isDifferent) return null;
      return { key: after.key, before, after };
    })
    .filter((item) => item !== null);

  const disabledTop = disabled[0]?.key ?? null;
  const enabledTop = enabled[0]?.key ?? null;
  const topMatchChanged = disabledTop !== enabledTop;

  return {
    url,
    disabled,
    enabled,
    added,
    removed,
    changed,
    topMatchChanged,
  };
};

const formatSnapshot = (item: MatchSnapshot): string => {
  const path = item.matchedPath ?? "-";
  return `#${item.rank} ${item.label} [${item.matchType}] path=${path} score=${item.score}`;
};

const printDiff = (diff: MatchDiff) => {
  console.log(`URL: ${diff.url}`);
  console.log(
    `  disabled=${diff.disabled.length} enabled=${diff.enabled.length} top_changed=${diff.topMatchChanged ? "yes" : "no"}`,
  );

  if (diff.added.length > 0) {
    console.log("  Added when enabled:");
    for (const item of diff.added) console.log(`    + ${formatSnapshot(item)}`);
  }

  if (diff.removed.length > 0) {
    console.log("  Removed when enabled:");
    for (const item of diff.removed) console.log(`    - ${formatSnapshot(item)}`);
  }

  if (diff.changed.length > 0) {
    console.log("  Changed:");
    for (const item of diff.changed) {
      console.log(`    * ${item.key}`);
      console.log(`      disabled: ${formatSnapshot(item.before)}`);
      console.log(`      enabled : ${formatSnapshot(item.after)}`);
    }
  }
};

const parseNumberArg = (
  args: string[],
  prefix: string,
  fallback: number,
): number => {
  const raw = args.find((arg) => arg.startsWith(`${prefix}=`));
  const value = Number(raw?.slice(prefix.length + 1) ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const buildSummary = (diffs: MatchDiff[], urlsChecked: number): Summary => {
  return diffs.reduce<Summary>(
    (summary, diff) => ({
      urlsChecked,
      urlsChanged: summary.urlsChanged + 1,
      topMatchChanges: summary.topMatchChanges + (diff.topMatchChanged ? 1 : 0),
      addedMatches: summary.addedMatches + diff.added.length,
      removedMatches: summary.removedMatches + diff.removed.length,
      changedMatches: summary.changedMatches + diff.changed.length,
    }),
    {
      urlsChecked,
      urlsChanged: 0,
      topMatchChanges: 0,
      addedMatches: 0,
      removedMatches: 0,
      changedMatches: 0,
    },
  );
};

const run = async () => {
  const [, , maybeUrl, ...rest] = process.argv;
  const hasExplicitUrl = Boolean(maybeUrl && !maybeUrl.startsWith("--"));
  const args = hasExplicitUrl ? rest : [maybeUrl, ...rest].filter(Boolean);
  const matchLimit = parseNumberArg(args, "--limit", 10);
  const maxDiffsToPrint = parseNumberArg(args, "--max-diffs", 25);
  const includeUnchanged = args.includes("--include-unchanged");

  console.log(`Fetching Cargo dataset from ${DATA_REMOTE_URL}`);
  const raw = await fetchDataset();
  const dataset = flattenDataset(raw);
  const urls = hasExplicitUrl
    ? [String(maybeUrl)]
    : collectCargoUrls(dataset);

  console.log(`Dataset entries: ${dataset.length}`);
  console.log(`URLs to compare: ${urls.length}`);
  console.log(`Match limit per URL: ${matchLimit}`);
  console.log("");

  const diffs: MatchDiff[] = [];
  let invalidUrls = 0;

  for (const rawUrl of urls) {
    const parsed = safeParseUrl(rawUrl);
    if (!parsed) {
      invalidUrls += 1;
      continue;
    }

    const normalizedUrl = parsed.toString();
    const disabled = runWithSubdomainSetting(dataset, normalizedUrl, matchLimit, false);
    const enabled = runWithSubdomainSetting(dataset, normalizedUrl, matchLimit, true);
    const diff = compareSnapshots(normalizedUrl, disabled, enabled);

    const changed =
      diff.added.length > 0 ||
      diff.removed.length > 0 ||
      diff.changed.length > 0 ||
      diff.topMatchChanged;

    if (includeUnchanged || changed) {
      diffs.push(diff);
    }
  }

  resetMatchingConfig();

  const changedDiffs = diffs.filter(
    (diff) =>
      diff.added.length > 0 ||
      diff.removed.length > 0 ||
      diff.changed.length > 0 ||
      diff.topMatchChanged,
  );
  const summary = buildSummary(changedDiffs, urls.length - invalidUrls);

  console.log("Summary");
  console.log(`  URLs checked: ${summary.urlsChecked}`);
  console.log(`  Invalid URLs skipped: ${invalidUrls}`);
  console.log(`  URLs with changed matches: ${summary.urlsChanged}`);
  console.log(`  URLs with top-match change: ${summary.topMatchChanges}`);
  console.log(`  Added matches (enabled only): ${summary.addedMatches}`);
  console.log(`  Removed matches (enabled only): ${summary.removedMatches}`);
  console.log(`  Changed existing matches: ${summary.changedMatches}`);
  console.log("");

  if (diffs.length === 0) {
    console.log("No URLs selected for output.");
    return;
  }

  const outputDiffs = includeUnchanged ? diffs : changedDiffs;
  const limitedDiffs = outputDiffs.slice(0, maxDiffsToPrint);

  if (outputDiffs.length === 0) {
    console.log("No match differences found between subdomain matching disabled vs enabled.");
    return;
  }

  console.log(
    `Showing ${limitedDiffs.length} of ${outputDiffs.length} ${includeUnchanged ? "URL comparisons" : "changed URL comparisons"}${outputDiffs.length > maxDiffsToPrint ? ` (use --max-diffs=${outputDiffs.length} to see all)` : ""}:`,
  );
  console.log("");

  for (const diff of limitedDiffs) {
    printDiff(diff);
    console.log("");
  }
};

void run();

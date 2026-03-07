import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CargoEntry, CargoEntryType } from "../src/shared/types.ts";
import { DATA_REMOTE_URL, DATASET_KEYS } from "../src/shared/constants.ts";
import { decodeEntityStrings } from "../src/shared/html.ts";

type RawDataset = Record<string, unknown>;

type OutputFormat = "text" | "wiki";

type Args = {
  inputPath?: string;
  format: OutputFormat;
  outPath?: string;
  minMatchLength: number;
};

type FindingKind =
  | "missing_description"
  | "missing_website"
  | "website_link_sanity"
  | "incident_multiple_statuses"
  | "incident_missing_start_date"
  | "incident_invalid_start_date"
  | "incident_date_consistency"
  | "short_page_name_for_matching"
  | "short_reference_value_for_matching";

type Finding = {
  kind: FindingKind;
  entry: CargoEntry;
  field?: string;
  value?: string;
  details?: string;
};

type FindingGroup = {
  title: string;
  description: string;
  items: Finding[];
};

type FindingGroupDefinition = {
  kind: FindingKind;
  title: string;
  description: string;
};

type ValidationResult = {
  entries: CargoEntry[];
  datasetSize: number;
  countsByType: Record<CargoEntryType, number>;
  groups: FindingGroup[];
  findingCount: number;
};

const DEFAULT_WIKI_OUTPUT_PATH = "cargo-popover-validation.wiki";
const DEFAULT_MIN_MATCH_LENGTH = 2;

const usage = [
  "Usage:",
  "  node --experimental-strip-types scripts/verify-cargo-quality.ts [--input <file>] [--format text|wiki] [--out <file>] [--min-match-length <n>]",
  "",
  "Defaults to fetching the latest Cargo dataset from the remote export URL.",
  "",
  "Examples:",
  "  node --experimental-strip-types scripts/verify-cargo-quality.ts",
  "  node --experimental-strip-types scripts/verify-cargo-quality.ts --input tests/fixtures/all_cargo_combined.json",
  "  node --experimental-strip-types scripts/verify-cargo-quality.ts --format wiki --out reports/cargo-popover-validation.wiki",
].join("\n");

const FINDING_GROUP_DEFINITIONS: FindingGroupDefinition[] = [
  {
    kind: "missing_description",
    title: "Missing descriptions",
    description:
      "Entries without a Description can leave the top popover card missing key context.",
  },
  {
    kind: "missing_website",
    title: "Missing website links",
    description:
      "Company/Product/ProductLine entries without Website values are harder to match from visited pages and may not surface in the popover.",
  },
  {
    kind: "website_link_sanity",
    title: "Website link sanity",
    description:
      "Malformed or unparseable Website values can break URL matching and prevent reliable popover surfacing.",
  },
  {
    kind: "incident_multiple_statuses",
    title: "Incidents with multiple statuses",
    description:
      "The popover displays only the primary incident status, so comma-separated statuses can be misleading.",
  },
  {
    kind: "incident_missing_start_date",
    title: "Incidents without start dates",
    description:
      "Incident sorting in the popover relies on StartDate; missing dates reduce ordering accuracy.",
  },
  {
    kind: "incident_invalid_start_date",
    title: "Incidents with invalid start dates",
    description:
      "Invalid StartDate values cannot be parsed for sorting and are treated like missing dates.",
  },
  {
    kind: "incident_date_consistency",
    title: "Incident date consistency",
    description:
      "Inconsistent incident dates (for example EndDate before StartDate, or resolved incidents without EndDate) reduce popover ordering and timeline accuracy.",
  },
  {
    kind: "short_page_name_for_matching",
    title: "Page names too short for page-context matching",
    description:
      "Names shorter than the matching threshold are skipped by page-context matching and may never surface in the popover.",
  },
  {
    kind: "short_reference_value_for_matching",
    title: "Reference values too short for reliable matching",
    description:
      "Very short Company/Product/ProductLine references can normalize to ambiguous tokens and weaken relation/popover relevance.",
  },
];

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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

const splitReferencePieces = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  return value
    .split(/[,;|]/)
    .map((piece) => piece.trim())
    .filter(Boolean);
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
    .filter(Boolean)) {
    pushIfUnique(value);
  }

  return values;
};

const isParseableWebsiteUrl = (value: string): boolean => {
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
};

const hasWebsiteSyntaxMarkers = (value: string): boolean => {
  return /\[|\]/.test(value);
};

const pushFinding = (
  groupsByKind: Map<FindingKind, FindingGroup>,
  finding: Finding,
) => {
  const group = groupsByKind.get(finding.kind);
  if (!group) return;
  group.items.push(finding);
};

const buildFindingGroups = (): Map<FindingKind, FindingGroup> => {
  return new Map(
    FINDING_GROUP_DEFINITIONS.map((group) => [
      group.kind,
      {
        title: group.title,
        description: group.description,
        items: [] as Finding[],
      },
    ]),
  );
};

const validateEntries = (
  entries: CargoEntry[],
  minMatchLength: number,
): ValidationResult => {
  const countsByType: Record<CargoEntryType, number> = {
    Company: 0,
    Incident: 0,
    Product: 0,
    ProductLine: 0,
  };
  const groupsByKind = buildFindingGroups();

  for (const entry of entries) {
    countsByType[entry._type] += 1;

    const descriptionValue =
      typeof entry.Description === "string" ? entry.Description.trim() : "";
    if (entry._type !== "Incident" && !descriptionValue) {
      pushFinding(groupsByKind, {
        kind: "missing_description",
        entry,
        field: "Description",
      });
    }

    const websiteValue =
      typeof entry.Website === "string" ? entry.Website.trim() : "";
    if (entry._type !== "Incident" && !websiteValue) {
      pushFinding(groupsByKind, {
        kind: "missing_website",
        entry,
        field: "Website",
      });
    } else if (entry._type !== "Incident") {
      const websiteUrls = splitWebsiteField(websiteValue);
      const hasInvalidUrl = websiteUrls.some(
        (url) => !isParseableWebsiteUrl(url),
      );
      const malformedWikiSyntax =
        hasWebsiteSyntaxMarkers(websiteValue) && websiteUrls.length === 0;

      if (websiteUrls.length === 0 || hasInvalidUrl || malformedWikiSyntax) {
        pushFinding(groupsByKind, {
          kind: "website_link_sanity",
          entry,
          field: "Website",
          value: websiteValue,
          details:
            websiteUrls.length === 0
              ? "No parseable URL found in Website field"
              : hasInvalidUrl
                ? "One or more Website URLs are invalid"
                : "Malformed wiki-style Website link syntax",
        });
      }
    }

    if (entry._type === "Incident") {
      const statusParts =
        typeof entry.Status === "string"
          ? entry.Status.split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

      if (statusParts.length > 1) {
        pushFinding(groupsByKind, {
          kind: "incident_multiple_statuses",
          entry,
          field: "Status",
          value: String(entry.Status),
          details: `Primary popover status would be "${statusParts[0]}"`,
        });
      }

      const hasStartDate =
        typeof entry.StartDate === "string" &&
        entry.StartDate.trim().length > 0;
      if (!hasStartDate) {
        pushFinding(groupsByKind, {
          kind: "incident_missing_start_date",
          entry,
          field: "StartDate",
        });
      } else if (Number.isNaN(Date.parse(entry.StartDate))) {
        pushFinding(groupsByKind, {
          kind: "incident_invalid_start_date",
          entry,
          field: "StartDate",
          value: String(entry.StartDate),
        });
      }

      const statusValues =
        typeof entry.Status === "string"
          ? entry.Status.split(",")
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean)
          : [];
      const startDateMs =
        typeof entry.StartDate === "string" && entry.StartDate.trim()
          ? Date.parse(entry.StartDate)
          : Number.NaN;
      const endDateRaw =
        typeof entry.EndDate === "string" ? entry.EndDate.trim() : "";
      const endDateMs = endDateRaw ? Date.parse(endDateRaw) : Number.NaN;
      const hasResolvedStatus = statusValues.includes("resolved");
      const hasEndDate = endDateRaw.length > 0;
      const invalidEndDate = hasEndDate && Number.isNaN(endDateMs);
      const endBeforeStart =
        !Number.isNaN(startDateMs) &&
        !Number.isNaN(endDateMs) &&
        endDateMs < startDateMs;
      const resolvedWithoutEndDate = hasResolvedStatus && !hasEndDate;

      if (invalidEndDate || endBeforeStart || resolvedWithoutEndDate) {
        const reasons: string[] = [];
        if (invalidEndDate) reasons.push("EndDate is invalid");
        if (endBeforeStart) reasons.push("EndDate is earlier than StartDate");
        if (resolvedWithoutEndDate)
          reasons.push("Status includes Resolved but EndDate is missing");

        pushFinding(groupsByKind, {
          kind: "incident_date_consistency",
          entry,
          field: "StartDate/EndDate/Status",
          details: reasons.join("; "),
        });
      }
    }

    if (entry._type !== "Incident") {
      const normalizedPageName = normalizeText(String(entry.PageName ?? ""));
      if (
        normalizedPageName.length > 0 &&
        normalizedPageName.length < minMatchLength
      ) {
        pushFinding(groupsByKind, {
          kind: "short_page_name_for_matching",
          entry,
          field: "PageName",
          value: String(entry.PageName ?? ""),
          details: `Normalized length = ${normalizedPageName.length} (< ${minMatchLength})`,
        });
      }
    }

    for (const field of ["Company", "Product", "ProductLine"] as const) {
      for (const piece of splitReferencePieces(entry[field])) {
        const normalized = normalizeText(piece);
        if (normalized.length === 0 || normalized.length >= minMatchLength) {
          continue;
        }

        pushFinding(groupsByKind, {
          kind: "short_reference_value_for_matching",
          entry,
          field,
          value: piece,
          details: `Normalized "${normalized}" has length ${normalized.length} (< ${minMatchLength})`,
        });
      }
    }
  }

  const groups = Array.from(groupsByKind.values());
  const findingCount = groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return {
    entries,
    datasetSize: entries.length,
    countsByType,
    groups,
    findingCount,
  };
};

type MatrixRow = {
  entry: CargoEntry;
  flags: Set<FindingKind>;
};

const getMatrixRows = (result: ValidationResult): MatrixRow[] => {
  const flaggedByEntryKey = new Map<string, Set<FindingKind>>();

  for (const group of result.groups) {
    for (const item of group.items) {
      const key = entryMatrixKey(item.entry);
      const current = flaggedByEntryKey.get(key) ?? new Set<FindingKind>();
      current.add(item.kind);
      flaggedByEntryKey.set(key, current);
    }
  }

  const sortedEntries = [...result.entries].sort((left, right) => {
    const leftFlags = flaggedByEntryKey.get(entryMatrixKey(left))?.size ?? 0;
    const rightFlags = flaggedByEntryKey.get(entryMatrixKey(right))?.size ?? 0;
    if (rightFlags !== leftFlags) return rightFlags - leftFlags;

    const typeCompare = left._type.localeCompare(right._type);
    if (typeCompare !== 0) return typeCompare;

    const nameCompare = String(left.PageName ?? "").localeCompare(
      String(right.PageName ?? ""),
    );
    if (nameCompare !== 0) return nameCompare;

    return String(left.PageID ?? "").localeCompare(String(right.PageID ?? ""));
  });

  return sortedEntries
    .map((entry) => ({
      entry,
      flags:
        flaggedByEntryKey.get(entryMatrixKey(entry)) ?? new Set<FindingKind>(),
    }))
    .filter((row) => row.flags.size > 0);
};

const padCell = (value: string, width: number): string => {
  const truncated =
    value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
  return truncated.padEnd(width, " ");
};

const buildAsciiTable = (headers: string[], rows: string[][]): string => {
  const widths = headers.map((header, index) => {
    const maxRowWidth = rows.reduce((max, row) => {
      return Math.max(max, (row[index] ?? "").length);
    }, 0);
    return Math.max(header.length, maxRowWidth);
  });

  const separator = `+${widths.map((width) => "-".repeat(width + 2)).join("+")}+`;
  const renderRow = (cells: string[]) => {
    return `| ${cells
      .map((cell, index) => padCell(cell ?? "", widths[index] ?? 0))
      .join(" | ")} |`;
  };

  return [
    separator,
    renderRow(headers),
    separator,
    ...rows.map((row) => renderRow(row)),
    separator,
  ].join("\n");
};

const formatTextReport = (result: ValidationResult, args: Args): string => {
  const lines: string[] = [];
  const matrixRows = getMatrixRows(result);
  const headers = [
    "PageName",
    "Type",
    "Description",
    "Website",
    "Website sanity",
    "Single status",
    "Start date present",
    "Start date valid",
    "Date consistency",
    "PageName match length",
    "Ref token length",
  ];
  const rows = matrixRows.map(({ entry, flags }) => {
    const hasProblem = (kind: FindingKind) => flags.has(kind);
    const descriptionCell =
      entry._type === "Incident"
        ? "-"
        : hasProblem("missing_description")
          ? "❌"
          : "✅";
    const websiteCell =
      entry._type === "Incident"
        ? "-"
        : hasProblem("missing_website")
          ? "❌"
          : "✅";
    const websiteSanityCell =
      entry._type === "Incident"
        ? "-"
        : hasProblem("website_link_sanity")
          ? "❌"
          : "✅";

    return [
      String(entry.PageName ?? "") || "(missing PageName)",
      entry._type,
      descriptionCell,
      websiteCell,
      websiteSanityCell,
      hasProblem("incident_multiple_statuses") ? "❌" : "✅",
      hasProblem("incident_missing_start_date") ? "❌" : "✅",
      hasProblem("incident_invalid_start_date") ? "❌" : "✅",
      hasProblem("incident_date_consistency") ? "❌" : "✅",
      hasProblem("short_page_name_for_matching") ? "❌" : "✅",
      hasProblem("short_reference_value_for_matching") ? "❌" : "✅",
    ];
  });

  lines.push("Cargo Popover Validation Report");
  lines.push("================================");
  lines.push(
    `Input: ${args.inputPath ? args.inputPath : `${DATA_REMOTE_URL} (latest remote)`}`,
  );
  lines.push(`Dataset entries: ${result.datasetSize}`);
  lines.push(
    `By type: Company=${result.countsByType.Company}, Incident=${result.countsByType.Incident}, Product=${result.countsByType.Product}, ProductLine=${result.countsByType.ProductLine}`,
  );
  lines.push(`Minimum matching length threshold: ${args.minMatchLength}`);
  lines.push(`Total findings: ${result.findingCount}`);
  lines.push(
    "Matrix uses ✅ = passes/no issue, ❌ = issue found, - = not applicable",
  );
  lines.push(
    `Rows shown: ${matrixRows.length} (pages with at least one issue)`,
  );
  lines.push("");
  lines.push("Quality Check Definitions:");
  lines.push(
    "  Description present: Company/Product/ProductLine entries should include a description so the popover can show useful context instead of a sparse top card. (Incidents show - because this check is not applicable.)",
  );
  lines.push(
    "  Website: Company/Product/ProductLine entries should include Website links so URL matching can find them reliably from visited pages. (Incidents show - because this check is not applicable.)",
  );
  lines.push(
    "  Website sanity: Website values should contain parseable URLs (including valid wiki-style link syntax) so URL matching can use them reliably. (Incidents show - because this check is not applicable.)",
  );
  lines.push(
    "  Single incident status: The popover displays only one incident status, so multi-status values can misrepresent the incident state.",
  );
  lines.push(
    "  Incident start date present: StartDate is used to sort incidents in the popover; missing dates reduce ordering accuracy.",
  );
  lines.push(
    "  Incident start date valid: Invalid dates cannot be parsed for sorting and behave like missing dates.",
  );
  lines.push(
    "  Date consistency: Incident dates and status should agree (for example no EndDate before StartDate, and resolved incidents should have an EndDate).",
  );
  lines.push(
    "  PageName long enough for matching: Very short names may be skipped by page-context matching and fail to surface in the popover.",
  );
  lines.push(
    "  Company/Product/ProductLine refs long enough: Very short reference tokens weaken relation matching and can reduce popover relevance/expansion quality.",
  );
  lines.push("");
  if (rows.length === 0) {
    lines.push("No pages with quality issues found.");
  } else {
    lines.push(buildAsciiTable(headers, rows));
  }

  return lines.join("\n");
};

const escapeWiki = (value: string): string => {
  return value.replace(/\|/g, "{{!}}").replace(/\n/g, " ");
};

const wikiPageLink = (entry: CargoEntry): string => {
  const pageName = String(entry.PageName ?? "").trim() || "(missing PageName)";
  return `[[${escapeWiki(pageName)}]]`;
};

const entryMatrixKey = (entry: CargoEntry): string => {
  return `${entry._type}:${String(entry.PageID ?? "").trim()}:${String(
    entry.PageName ?? "",
  ).trim()}`;
};

const formatWikiCheckMark = (hasProblem: boolean): string => {
  return hasProblem ? "{{Cross}}" : "{{Tick}}";
};

const formatWikiReport = (result: ValidationResult, args: Args): string => {
  const lines: string[] = [];
  const matrixRows = getMatrixRows(result);

  lines.push("= Cargo Popover Validation Report =");
  lines.push("");
  lines.push("== Summary ==");
  lines.push(
    `* Input: <code>${escapeWiki(
      args.inputPath ? args.inputPath : `${DATA_REMOTE_URL} (latest remote)`,
    )}</code>`,
  );
  lines.push(`* Dataset entries: ${result.datasetSize}`);
  lines.push(
    `* By type: Company=${result.countsByType.Company}, Incident=${result.countsByType.Incident}, Product=${result.countsByType.Product}, ProductLine=${result.countsByType.ProductLine}`,
  );
  lines.push(`* Minimum matching length threshold: ${args.minMatchLength}`);
  lines.push(`* Total findings: ${result.findingCount}`);
  lines.push(
    "* Matrix uses {{Tick}} = passes/no issue, {{Cross}} = issue found, - = not applicable",
  );
  lines.push(
    `* Rows shown: ${matrixRows.length} (pages with at least one issue)`,
  );
  lines.push("");
  lines.push("== Quality Check Definitions ==");
  lines.push(
    "* '''Description present''': Company/Product/ProductLine entries have a non-empty Description for popover context (incidents are not applicable).",
  );
  lines.push(
    "* '''Website''': Company/Product/ProductLine entries have a non-empty Website field so URL matching can surface them in the popover (incidents are not applicable).",
  );
  lines.push(
    "* '''Website sanity''': Company/Product/ProductLine Website values contain parseable URLs / valid wiki-style link syntax so URL matching can use them reliably (incidents are not applicable).",
  );
  lines.push(
    "* '''Single incident status''': Incident Status is not a comma-separated multi-status value.",
  );
  lines.push(
    "* '''Incident start date present''': Incident has a non-empty StartDate for popover sorting.",
  );
  lines.push(
    "* '''Incident start date valid''': Incident StartDate parses into a valid date.",
  );
  lines.push(
    "* '''Date consistency''': Incident EndDate is not before StartDate, and resolved incidents should include an EndDate.",
  );
  lines.push(
    "* '''PageName long enough for matching''': Non-incident PageName meets the page-context matching length threshold.",
  );
  lines.push(
    "* '''Company/Product/ProductLine refs long enough''': Reference tokens are not too short for reliable relation matching.",
  );
  lines.push("");
  lines.push("== Quality Matrix ==");
  lines.push(
    '{| class="wikitable sortable"\n! PageName\n! Description\n! Website\n! Website sanity\n! Single status\n! Start date present\n! Start date valid\n! Date consistency\n! PageName match length\n! Ref token length',
  );

  if (matrixRows.length === 0) {
    lines.push("|-");
    lines.push('| colspan="10" | No pages with quality issues found.');
  } else {
    for (const { entry, flags } of matrixRows) {
      const hasProblem = (kind: FindingKind) => flags.has(kind);

      lines.push("|-");
      lines.push(`| ${wikiPageLink(entry)} (${escapeWiki(entry._type)})`);
      lines.push(
        `| ${
          entry._type === "Incident"
            ? "-"
            : formatWikiCheckMark(hasProblem("missing_description"))
        }`,
      );
      lines.push(
        `| ${
          entry._type === "Incident"
            ? "-"
            : formatWikiCheckMark(hasProblem("missing_website"))
        }`,
      );
      lines.push(
        `| ${
          entry._type === "Incident"
            ? "-"
            : formatWikiCheckMark(hasProblem("website_link_sanity"))
        }`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("incident_multiple_statuses"))}`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("incident_missing_start_date"))}`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("incident_invalid_start_date"))}`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("incident_date_consistency"))}`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("short_page_name_for_matching"))}`,
      );
      lines.push(
        `| ${formatWikiCheckMark(hasProblem("short_reference_value_for_matching"))}`,
      );
    }
  }

  lines.push("|}");

  return lines.join("\n");
};

const parseArgs = (argv: string[]): Args => {
  let inputPath: string | undefined;
  let format: OutputFormat = "text";
  let outPath: string | undefined;
  let minMatchLength = DEFAULT_MIN_MATCH_LENGTH;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }

    if (arg === "--input" || arg === "-i") {
      const next = argv[index + 1];
      if (!next) throw new Error(`Missing value for ${arg}`);
      inputPath = next;
      index += 1;
      continue;
    }

    if (arg === "--format" || arg === "-f") {
      const next = argv[index + 1];
      if (next !== "text" && next !== "wiki") {
        throw new Error(`Invalid --format value: ${String(next)}`);
      }
      format = next;
      index += 1;
      continue;
    }

    if (arg === "--out" || arg === "-o") {
      const next = argv[index + 1];
      if (!next) throw new Error(`Missing value for ${arg}`);
      outPath = next;
      index += 1;
      continue;
    }

    if (arg === "--min-match-length") {
      const next = argv[index + 1];
      const value = Number(next);
      if (!next || !Number.isInteger(value) || value < 1) {
        throw new Error(`Invalid --min-match-length value: ${String(next)}`);
      }
      minMatchLength = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    inputPath = arg;
  }

  return {
    inputPath,
    format,
    outPath,
    minMatchLength,
  };
};

const loadDataset = async (inputPath?: string): Promise<CargoEntry[]> => {
  if (inputPath) {
    const rawText = await readFile(inputPath, "utf8");
    const parsed = JSON.parse(rawText) as RawDataset;
    return flattenDataset(parsed);
  }

  const response = await fetch(DATA_REMOTE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch dataset (${response.status}) from ${DATA_REMOTE_URL}`,
    );
  }

  const parsed = (await response.json()) as RawDataset;
  return flattenDataset(parsed);
};

const writeWikiReport = async (content: string, targetPath: string) => {
  const absoluteTargetPath = path.resolve(targetPath);
  await writeFile(absoluteTargetPath, content, "utf8");
  console.log(`Wrote wiki report to ${absoluteTargetPath}`);
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const entries = await loadDataset(args.inputPath);
  const result = validateEntries(entries, args.minMatchLength);

  if (args.format === "text") {
    console.log(formatTextReport(result, args));
  } else {
    const wikiContent = formatWikiReport(result, args);
    const outputPath = args.outPath || DEFAULT_WIKI_OUTPUT_PATH;
    await writeWikiReport(wikiContent, outputPath);
  }

  if (result.findingCount > 0) {
    process.exitCode = 1;
  }
};

void run().catch((error) => {
  console.error("verify-cargo-quality failed");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  console.error("");
  console.error(usage);
  process.exitCode = 1;
});

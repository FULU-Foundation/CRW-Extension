type ValueRange = {
  start: number;
  end: number;
  indent: string;
};

export type EcommerceConfigUpdateResult = {
  updatedSource: string;
  changed: boolean;
  addedDomains: string[];
  addedToDenylist: boolean;
};

export type RunEcommerceAddOptions = {
  family: string;
  domains: string[];
  dryRun: boolean;
  readSource: () => Promise<string>;
  writeSource: (nextSource: string) => Promise<void>;
};

export type RunEcommerceAddResult = EcommerceConfigUpdateResult & {
  family: string;
  normalizedDomains: string[];
};

const DOMAIN_PATTERN = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const findMatchingBracket = (
  source: string,
  start: number,
  openChar: "[" | "{",
): number => {
  const closeChar = openChar === "[" ? "]" : "}";
  let depth = 0;
  let activeQuote: "'" | '"' | "`" | null = null;
  let escaping = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (!char) continue;

    if (activeQuote) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === "\\") {
        escaping = true;
        continue;
      }
      if (char === activeQuote) {
        activeQuote = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      activeQuote = char;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`Unmatched ${openChar} while parsing matchingConfig.ts`);
};

const findPropertyValueRange = (
  source: string,
  propertyName: string,
  fromIndex = 0,
): ValueRange => {
  const sourceWindow = source.slice(fromIndex);
  const pattern = new RegExp(
    `(^[ \\t]*)${escapeRegExp(propertyName)}\\s*:\\s*`,
    "m",
  );
  const match = pattern.exec(sourceWindow);
  if (!match || typeof match.index !== "number") {
    throw new Error(`Could not find "${propertyName}" in matchingConfig.ts`);
  }

  const startIndex = fromIndex + match.index;
  let valueStart = startIndex + match[0].length;
  while (/\s/.test(source[valueStart] || "")) valueStart += 1;

  const openChar = source[valueStart];
  if (openChar !== "[" && openChar !== "{") {
    throw new Error(
      `"${propertyName}" must be an array or object literal in matchingConfig.ts`,
    );
  }

  const end = findMatchingBracket(source, valueStart, openChar);
  return {
    start: valueStart,
    end: end + 1,
    indent: match[1] || "",
  };
};

const parseStringArrayLiteral = (literal: string): string[] => {
  const values: string[] = [];
  const pattern = /"((?:\\.|[^"\\])*)"/g;
  let match = pattern.exec(literal);
  while (match) {
    values.push(JSON.parse(`"${match[1] || ""}"`) as string);
    match = pattern.exec(literal);
  }
  return values;
};

const parseStringMapLiteral = (literal: string): Array<[string, string]> => {
  const values: Array<[string, string]> = [];
  const pattern = /"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match = pattern.exec(literal);
  while (match) {
    const key = JSON.parse(`"${match[1] || ""}"`) as string;
    const value = JSON.parse(`"${match[2] || ""}"`) as string;
    values.push([key, value]);
    match = pattern.exec(literal);
  }
  return values;
};

const formatStringArrayLiteral = (values: string[], indent: string): string => {
  if (values.length === 0) return "[]";
  const innerIndent = `${indent}  `;
  return [
    "[",
    ...values.map((value) => `${innerIndent}${JSON.stringify(value)},`),
    `${indent}]`,
  ].join("\n");
};

const formatStringMapLiteral = (
  entries: Array<[string, string]>,
  indent: string,
): string => {
  if (entries.length === 0) return "{}";
  const innerIndent = `${indent}  `;
  return [
    "{",
    ...entries.map(
      ([key, value]) =>
        `${innerIndent}${JSON.stringify(key)}: ${JSON.stringify(value)},`,
    ),
    `${indent}}`,
  ].join("\n");
};

const applyReplacements = (
  source: string,
  replacements: Array<{ start: number; end: number; value: string }>,
): string => {
  return [...replacements]
    .sort((left, right) => right.start - left.start)
    .reduce((nextSource, replacement) => {
      return (
        nextSource.slice(0, replacement.start) +
        replacement.value +
        nextSource.slice(replacement.end)
      );
    }, source);
};

export const normalizeFamily = (familyRaw: string): string => {
  const normalized = familyRaw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  if (!normalized) {
    throw new Error("--family must be a non-empty slug");
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(
      `Invalid --family "${familyRaw}". Use lowercase letters, numbers, and hyphens only.`,
    );
  }

  return normalized;
};

const normalizeDomain = (domainRaw: string): string => {
  const trimmed = domainRaw.trim().toLowerCase();
  if (!trimmed) {
    throw new Error("Encountered empty domain in --domains");
  }

  const hostWithPath = trimmed.includes("://")
    ? new URL(trimmed).hostname.toLowerCase()
    : trimmed.split("/")[0] || "";

  let host = hostWithPath.split(":")[0] || "";
  host = host.replace(/^www\./, "").replace(/\.+$/, "");
  if (!DOMAIN_PATTERN.test(host)) {
    throw new Error(`Invalid domain "${domainRaw}"`);
  }
  return host;
};

export const normalizeDomains = (domainsRaw: string[]): string[] => {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const rawValue of domainsRaw) {
    for (const token of rawValue.split(",")) {
      const normalized = normalizeDomain(token);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      values.push(normalized);
    }
  }

  if (values.length === 0) {
    throw new Error("--domains must include at least one domain");
  }

  return values;
};

export const applyEcommerceConfigUpdate = (
  source: string,
  family: string,
  domains: string[],
): EcommerceConfigUpdateResult => {
  const defaultConfigIndex = source.indexOf("const DEFAULT_MATCHING_CONFIG");
  if (defaultConfigIndex < 0) {
    throw new Error("Could not find DEFAULT_MATCHING_CONFIG in matchingConfig.ts");
  }

  const denylistRange = findPropertyValueRange(
    source,
    "marketplaceBrandDenylist",
    defaultConfigIndex,
  );
  const mapRange = findPropertyValueRange(
    source,
    "ecommerceDomainFamilyMap",
    defaultConfigIndex,
  );

  const existingDenylist = parseStringArrayLiteral(
    source.slice(denylistRange.start, denylistRange.end),
  );
  const existingEntries = parseStringMapLiteral(
    source.slice(mapRange.start, mapRange.end),
  );
  const existingByDomain = new Map(existingEntries);

  const addedDomains: string[] = [];
  for (const domain of domains) {
    const existingFamily = existingByDomain.get(domain);
    if (existingFamily && existingFamily !== family) {
      throw new Error(
        `Domain "${domain}" is already mapped to family "${existingFamily}"`,
      );
    }
    if (!existingFamily) {
      existingEntries.push([domain, family]);
      existingByDomain.set(domain, family);
      addedDomains.push(domain);
    }
  }

  let addedToDenylist = false;
  if (!existingDenylist.includes(family)) {
    existingDenylist.push(family);
    addedToDenylist = true;
  }

  if (addedDomains.length === 0 && !addedToDenylist) {
    return {
      updatedSource: source,
      changed: false,
      addedDomains,
      addedToDenylist,
    };
  }

  const updatedSource = applyReplacements(source, [
    {
      start: denylistRange.start,
      end: denylistRange.end,
      value: formatStringArrayLiteral(existingDenylist, denylistRange.indent),
    },
    {
      start: mapRange.start,
      end: mapRange.end,
      value: formatStringMapLiteral(existingEntries, mapRange.indent),
    },
  ]);

  return {
    updatedSource,
    changed: true,
    addedDomains,
    addedToDenylist,
  };
};

export const runEcommerceAdd = async (
  options: RunEcommerceAddOptions,
): Promise<RunEcommerceAddResult> => {
  const family = normalizeFamily(options.family);
  const normalizedDomains = normalizeDomains(options.domains);
  const source = await options.readSource();
  const result = applyEcommerceConfigUpdate(source, family, normalizedDomains);

  if (result.changed && !options.dryRun) {
    await options.writeSource(result.updatedSource);
  }

  return {
    ...result,
    family,
    normalizedDomains,
  };
};

type EcommerceDataFile = {
  [key: string]: unknown;
  marketplaceBrandDenylist: string[];
  ecommerceDomainFamilyMap: Record<string, string>;
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

const parseEcommerceData = (source: string): EcommerceDataFile => {
  const parsed = JSON.parse(source) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid ecommerce data JSON: expected an object");
  }

  const value = parsed as Record<string, unknown>;
  const denylist = value.marketplaceBrandDenylist;
  const domainMap = value.ecommerceDomainFamilyMap;

  if (!Array.isArray(denylist)) {
    throw new Error(
      "Invalid ecommerce data JSON: marketplaceBrandDenylist must be an array",
    );
  }
  if (!domainMap || typeof domainMap !== "object" || Array.isArray(domainMap)) {
    throw new Error(
      "Invalid ecommerce data JSON: ecommerceDomainFamilyMap must be an object",
    );
  }

  const normalizedDenylist = denylist
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const normalizedDomainMap: Record<string, string> = {};
  for (const [domain, family] of Object.entries(domainMap)) {
    if (typeof domain !== "string" || typeof family !== "string") continue;
    const domainKey = domain.trim();
    const familyValue = family.trim();
    if (!domainKey || !familyValue) continue;
    normalizedDomainMap[domainKey] = familyValue;
  }

  return {
    ...value,
    marketplaceBrandDenylist: normalizedDenylist,
    ecommerceDomainFamilyMap: normalizedDomainMap,
  };
};

const stringifyEcommerceData = (value: EcommerceDataFile): string => {
  return `${JSON.stringify(value, null, 2)}\n`;
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
  const data = parseEcommerceData(source);
  const existingByDomain = new Map(
    Object.entries(data.ecommerceDomainFamilyMap),
  );

  const addedDomains: string[] = [];
  for (const domain of domains) {
    const existingFamily = existingByDomain.get(domain);
    if (existingFamily && existingFamily !== family) {
      throw new Error(
        `Domain "${domain}" is already mapped to family "${existingFamily}"`,
      );
    }
    if (!existingFamily) {
      data.ecommerceDomainFamilyMap[domain] = family;
      addedDomains.push(domain);
    }
  }

  let addedToDenylist = false;
  if (!data.marketplaceBrandDenylist.includes(family)) {
    data.marketplaceBrandDenylist.push(family);
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

  data.ecommerceDomainFamilyMap = Object.fromEntries(
    Object.entries(data.ecommerceDomainFamilyMap).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

  return {
    updatedSource: stringifyEcommerceData(data),
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

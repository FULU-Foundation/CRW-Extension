import type { CargoEntry } from "@/shared/types";

type CargoEntryType = CargoEntry["_type"];

type RelationSignals = {
  type: CargoEntryType;
  companyNames: Set<string>;
  productNames: Set<string>;
  productLineNames: Set<string>;
  companyRefs: Set<string>;
  productRefs: Set<string>;
  productLineRefs: Set<string>;
};

const TYPE_PRIORITY: Record<CargoEntryType, number> = {
  Company: 0,
  Product: 1,
  ProductLine: 2,
  Incident: 3,
};

const normalizeEntityName = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const splitReferenceValue = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  return value
    .split(/[,;|]/)
    .map((piece) => piece.trim())
    .filter(Boolean);
};

const normalizeReferenceSet = (value: unknown): Set<string> => {
  const normalized = splitReferenceValue(value)
    .map((piece) => normalizeEntityName(piece))
    .filter(Boolean);
  return new Set(normalized);
};

const entryKey = (entry: CargoEntry): string => {
  const pageId = String(entry.PageID || "").trim();
  if (pageId) return pageId;
  return `${entry._type}:${entry.PageName}`;
};

const hasIntersection = (left: Set<string>, right: Set<string>): boolean => {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
};

const mergeSet = (target: Set<string>, source: Set<string>): boolean => {
  let changed = false;
  for (const value of source) {
    if (target.has(value)) continue;
    target.add(value);
    changed = true;
  }
  return changed;
};

const getRelationSignals = (entry: CargoEntry): RelationSignals => {
  const companyNames = new Set<string>();
  const productNames = new Set<string>();
  const productLineNames = new Set<string>();

  const selfName = normalizeEntityName(entry.PageName || "");
  if (entry._type === "Company" && selfName) companyNames.add(selfName);
  if (entry._type === "Product" && selfName) productNames.add(selfName);
  if (entry._type === "ProductLine" && selfName) productLineNames.add(selfName);

  return {
    type: entry._type,
    companyNames,
    productNames,
    productLineNames,
    companyRefs: normalizeReferenceSet(entry.Company),
    productRefs: normalizeReferenceSet(entry.Product),
    productLineRefs: normalizeReferenceSet(entry.ProductLine),
  };
};

const shouldIncludeByRelations = (
  signals: RelationSignals,
  knownCompanyNames: Set<string>,
  knownProductNames: Set<string>,
  knownProductLineNames: Set<string>,
): boolean => {
  if (signals.type === "Company") {
    return hasIntersection(signals.companyNames, knownCompanyNames);
  }
  if (signals.type === "ProductLine") {
    return (
      hasIntersection(signals.productLineNames, knownProductLineNames) ||
      hasIntersection(signals.companyRefs, knownCompanyNames)
    );
  }
  if (signals.type === "Product") {
    return (
      hasIntersection(signals.productNames, knownProductNames) ||
      hasIntersection(signals.companyRefs, knownCompanyNames) ||
      hasIntersection(signals.productLineRefs, knownProductLineNames)
    );
  }

  return (
    hasIntersection(signals.companyRefs, knownCompanyNames) ||
    hasIntersection(signals.productRefs, knownProductNames) ||
    hasIntersection(signals.productLineRefs, knownProductLineNames)
  );
};

const addSignalsToKnownSets = (
  signals: RelationSignals,
  knownCompanyNames: Set<string>,
  knownProductNames: Set<string>,
  knownProductLineNames: Set<string>,
): boolean => {
  const companyChanged =
    mergeSet(knownCompanyNames, signals.companyNames) ||
    mergeSet(knownCompanyNames, signals.companyRefs);
  const productChanged =
    mergeSet(knownProductNames, signals.productNames) ||
    mergeSet(knownProductNames, signals.productRefs);
  const productLineChanged =
    mergeSet(knownProductLineNames, signals.productLineNames) ||
    mergeSet(knownProductLineNames, signals.productLineRefs);

  return companyChanged || productChanged || productLineChanged;
};

const sortRelatedEntries = (
  entries: CargoEntry[],
  seedKeys: Set<string>,
): CargoEntry[] => {
  const seedEntries: CargoEntry[] = [];
  const relatedEntries: CargoEntry[] = [];

  for (const entry of entries) {
    if (seedKeys.has(entryKey(entry))) seedEntries.push(entry);
    else relatedEntries.push(entry);
  }

  relatedEntries.sort((left, right) => {
    const byType = TYPE_PRIORITY[left._type] - TYPE_PRIORITY[right._type];
    if (byType !== 0) return byType;

    const byName = left.PageName.localeCompare(right.PageName);
    if (byName !== 0) return byName;
    return left.PageID.localeCompare(right.PageID);
  });

  return [...seedEntries, ...relatedEntries];
};

export const expandRelatedEntries = (
  allEntries: CargoEntry[],
  seedEntries: CargoEntry[],
): CargoEntry[] => {
  if (seedEntries.length === 0) return [];

  const selected = new Map<string, CargoEntry>();
  const seedKeys = new Set<string>();
  const knownCompanyNames = new Set<string>();
  const knownProductNames = new Set<string>();
  const knownProductLineNames = new Set<string>();

  for (const seed of seedEntries) {
    const key = entryKey(seed);
    selected.set(key, seed);
    seedKeys.add(key);
    const signals = getRelationSignals(seed);
    addSignalsToKnownSets(
      signals,
      knownCompanyNames,
      knownProductNames,
      knownProductLineNames,
    );
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const entry of allEntries) {
      const key = entryKey(entry);
      if (selected.has(key)) continue;

      const signals = getRelationSignals(entry);
      if (
        !shouldIncludeByRelations(
          signals,
          knownCompanyNames,
          knownProductNames,
          knownProductLineNames,
        )
      ) {
        continue;
      }

      selected.set(key, entry);
      addSignalsToKnownSets(
        signals,
        knownCompanyNames,
        knownProductNames,
        knownProductLineNames,
      );
      changed = true;
    }
  }

  return sortRelatedEntries(Array.from(selected.values()), seedKeys);
};

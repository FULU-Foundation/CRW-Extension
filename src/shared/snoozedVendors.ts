import {
  type CargoEntry,
  isCompanyEntry,
  isIncidentEntry,
  isProductEntry,
  isProductLineEntry,
} from "./types.ts";

export type SnoozedVendorState = {
  companyName: string;
  incidentSignature: string;
  snoozedAt: number;
};

export type SnoozedVendorMap = Record<string, SnoozedVendorState[]>;

const MAX_SNOOZE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const normalizeVendorKey = (
  value: string | null | undefined,
): string => {
  if (!value) return "";
  return value.trim().toLowerCase();
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const decodeSnoozedVendorState = (
  value: unknown,
): SnoozedVendorState | null => {
  if (!isObjectRecord(value)) return null;
  if (typeof value.companyName !== "string") return null;
  if (typeof value.incidentSignature !== "string") return null;
  if (typeof value.snoozedAt !== "number") return null;

  return {
    companyName: value.companyName,
    incidentSignature: value.incidentSignature,
    snoozedAt: value.snoozedAt,
  };
};

export const normalizeSnoozedVendorMap = (value: unknown): SnoozedVendorMap => {
  if (!isObjectRecord(value)) return {};

  const now = Date.now();
  const next: SnoozedVendorMap = {};

  for (const [vendor, rawValue] of Object.entries(value)) {
    const normalizedVendor = normalizeVendorKey(vendor);
    if (!normalizedVendor) continue;
    if (!Array.isArray(rawValue)) continue;

    const entries = rawValue
      .map((item) => decodeSnoozedVendorState(item))
      .filter((state): state is SnoozedVendorState => state !== null);

    const fresh = entries.filter(
      (entry) => now - entry.snoozedAt < MAX_SNOOZE_AGE_MS,
    );

    if (fresh.length > 0) {
      const existing = next[normalizedVendor];
      next[normalizedVendor] = existing ? [...existing, ...fresh] : fresh;
    }
  }

  return next;
};

export const addVendorSnoozeEntries = (
  map: SnoozedVendorMap,
  vendorNames: string[],
  incidentSignature: string,
  snoozedAt: number,
): SnoozedVendorMap => {
  const next: SnoozedVendorMap = { ...map };

  for (const companyName of vendorNames) {
    const vendorKey = normalizeVendorKey(companyName);
    if (!vendorKey) continue;

    const entries = [...(next[vendorKey] || [])];
    const state = { companyName, incidentSignature, snoozedAt };
    const existingIndex = entries.findIndex(
      (entry) => entry.incidentSignature === incidentSignature,
    );
    if (existingIndex >= 0) {
      entries[existingIndex] = state;
    } else {
      entries.push(state);
    }
    next[vendorKey] = entries;
  }

  return next;
};

export const removeVendorSnoozeEntries = (
  map: SnoozedVendorMap,
  vendorNames: string[],
  incidentSignature?: string,
): { map: SnoozedVendorMap; changed: boolean } => {
  const next: SnoozedVendorMap = { ...map };
  let changed = false;

  for (const companyName of vendorNames) {
    const vendorKey = normalizeVendorKey(companyName);
    const entries = next[vendorKey];
    if (!entries || entries.length === 0) continue;

    const filtered = incidentSignature
      ? entries.filter((entry) => entry.incidentSignature !== incidentSignature)
      : [];
    if (filtered.length === entries.length) continue;

    if (filtered.length === 0) {
      delete next[vendorKey];
    } else {
      next[vendorKey] = filtered;
    }
    changed = true;
  }

  return { map: next, changed };
};

export const hasVendorSnoozeEntry = (
  map: SnoozedVendorMap,
  vendorNames: string[],
  incidentSignature: string,
): boolean => {
  return vendorNames.some((companyName) => {
    const entries = map[normalizeVendorKey(companyName)];
    if (!entries || entries.length === 0) return false;
    return entries.some(
      (entry) => entry.incidentSignature === incidentSignature,
    );
  });
};

/**
 * Collects the display names of every company associated with the given
 * matches: matched Company entries plus the Company references on matched
 * incidents, products, and product lines. Company reference fields hold
 * comma-separated lists of company page names; Company entry page names are
 * used as-is.
 */
export const getVendorNamesFromMatches = (matches: CargoEntry[]): string[] => {
  const namesByKey = new Map<string, string>();

  const addName = (raw: string | undefined) => {
    if (!raw) return;
    const name = raw.trim();
    const key = normalizeVendorKey(name);
    if (!key) return;
    if (!namesByKey.has(key)) namesByKey.set(key, name);
  };

  const addCompanyReferences = (raw: string | undefined) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      addName(part);
    }
  };

  for (const entry of matches) {
    if (isCompanyEntry(entry)) {
      addName(entry.PageName);
    } else if (
      isIncidentEntry(entry) ||
      isProductEntry(entry) ||
      isProductLineEntry(entry)
    ) {
      addCompanyReferences(entry.Company);
    }
  }

  return [...namesByKey.values()];
};

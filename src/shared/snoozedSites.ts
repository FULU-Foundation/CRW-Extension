import { normalizeHostname } from "./util.ts";

export type SnoozedSiteState = {
  incidentSignature: string;
  snoozedAt: number;
};

export type SnoozedSiteMap = Record<string, SnoozedSiteState[]>;

const MAX_SNOOZE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const decodeSnoozedSiteState = (value: unknown): SnoozedSiteState | null => {
  if (!isObjectRecord(value)) return null;
  if (typeof value.incidentSignature !== "string") return null;
  if (typeof value.snoozedAt !== "number") return null;

  return {
    incidentSignature: value.incidentSignature,
    snoozedAt: value.snoozedAt,
  };
};

export const normalizeSnoozedSiteMap = (value: unknown): SnoozedSiteMap => {
  if (!isObjectRecord(value)) return {};

  const now = Date.now();
  const next: SnoozedSiteMap = {};

  for (const [domain, rawValue] of Object.entries(value)) {
    const normalizedDomain = normalizeHostname(domain);
    if (!normalizedDomain) continue;

    let entries: SnoozedSiteState[];

    if (Array.isArray(rawValue)) {
      entries = rawValue
        .map((item) => decodeSnoozedSiteState(item))
        .filter((state): state is SnoozedSiteState => state !== null);
    } else {
      const state = decodeSnoozedSiteState(rawValue);
      entries = state ? [state] : [];
    }

    const fresh = entries.filter(
      (entry) => now - entry.snoozedAt < MAX_SNOOZE_AGE_MS,
    );

    if (fresh.length > 0) {
      const existing = next[normalizedDomain];
      next[normalizedDomain] = existing ? [...existing, ...fresh] : fresh;
    }
  }

  return next;
};

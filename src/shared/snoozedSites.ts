export type SnoozedSiteState = {
  incidentSignature: string;
  snoozedAt: number;
};

export type SnoozedSiteMap = Record<string, SnoozedSiteState>;

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

export const normalizeSnoozedSiteMap = (
  value: unknown,
): SnoozedSiteMap => {
  if (!isObjectRecord(value)) return {};

  const next: SnoozedSiteMap = {};
  for (const [domain, rawState] of Object.entries(value)) {
    const state = decodeSnoozedSiteState(rawState);
    if (!state) continue;
    const normalizedDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
    if (!normalizedDomain) continue;
    next[normalizedDomain] = state;
  }

  return next;
};

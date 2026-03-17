export type SnoozedSiteState = {
  incidentSignature: string;
  snoozedAt: number;
};

export type SnoozedSiteMap = Record<string, SnoozedSiteState>;

export const normalizeSnoozedSiteMap = (
  value: SnoozedSiteMap | null | undefined,
): SnoozedSiteMap => {
  if (!value) return {};

  const next: SnoozedSiteMap = {};
  for (const [domain, state] of Object.entries(value)) {
    const normalizedDomain = domain.trim().toLowerCase().replace(/^www\./, "");
    if (!normalizedDomain) continue;
    next[normalizedDomain] = state;
  }

  return next;
};

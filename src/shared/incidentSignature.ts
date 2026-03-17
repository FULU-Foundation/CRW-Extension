import type { CargoEntry } from "@/shared/types";

const normalizeToken = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export const getIncidentPrimaryStatusToken = (entry: CargoEntry): string => {
  if (typeof entry.Status !== "string") return "";

  const [primaryStatus] = entry.Status.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return normalizeToken(primaryStatus);
};

export const buildIncidentSignature = (matches: CargoEntry[]): string => {
  const tokens = matches
    .filter((entry) => entry._type === "Incident")
    .map((entry) => {
      const incidentId = normalizeToken(entry.PageID);
      if (!incidentId) return "";
      const status = getIncidentPrimaryStatusToken(entry);
      return `${incidentId}|${status}`;
    })
    .filter(Boolean)
    .sort();

  return tokens.join("||");
};

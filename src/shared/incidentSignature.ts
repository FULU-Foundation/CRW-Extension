import {
  type CargoEntry,
  type IncidentEntry,
  isIncidentEntry,
} from "@/shared/types";

const normalizeToken = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim().toLowerCase();
};

export const getIncidentPrimaryStatusToken = (entry: IncidentEntry): string => {
  const status = entry.Status;
  if (!status) return "";

  const [primaryStatus] = status
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return normalizeToken(primaryStatus);
};

export const buildIncidentSignature = (matches: CargoEntry[]): string => {
  const tokens = matches
    .filter((entry): entry is IncidentEntry => isIncidentEntry(entry))
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

import type { CargoEntry } from "@/shared/types";

export type UrlMatchType = "exact" | "partial" | "subdomain";

export type UrlMatchDetail = {
  matchType: UrlMatchType;
  matchedPath: string | null;
  visitedHost: string;
  candidateHost: string;
};

export type UrlEntryMatch = {
  entry: CargoEntry;
  matchType: UrlMatchType;
  matchedPath: string | null;
  score: number;
  reasons: string[];
};

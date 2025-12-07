import { CargoEntry } from "@/shared/types";
import { extractUrlTokens, extractFuseQuery } from "./matchingHelper";
import Fuse, { FuseResult } from "fuse.js";

const fuseOptions = {
  // isCaseSensitive: false,
  includeScore: true,
  ignoreDiacritics: true,
  shouldSort: true,
  includeMatches: true,
  findAllMatches: true,
  minMatchCharLength: 1,
  location: 0,
  threshold: 0.6,
  distance: 100,
  useExtendedSearch: true,
  ignoreLocation: true,
  ignoreFieldNorm: true,
  // fieldNormWeight: 1,
  keys: [
    {
      name: "PageName",
      weight: 0.5
    },
    {
      name: "Website",
      weight: 0.5
    },
    {
      name: "Company",
      weight: 0.1
    },
    {
      name: "Category",
      weight: 0.1
    },
    {
      name: "ParentCompany",
      weight: 0.1
    },
    {
      name: "Industry",
      weight: 0.1
    },
    {
      name: "Type",
      weight: 0.1
    },
    {
      name: "Description",
      weight: 0.1
    },
  ]
};

export function matchByUrl(dataset: CargoEntry[], url: string): CargoEntry[] {
  const fuse = new Fuse(dataset, fuseOptions);

  const urlTokens = extractUrlTokens(url);
  const fusyQuery = extractFuseQuery(urlTokens);

  const results = fuse.search(fusyQuery);
  return results.slice(0, 3).map((value) => value.item);
}
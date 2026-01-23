import { CargoEntry } from "@/shared/types";
import * as Constants from "@/shared/constants";
import {
  extractUrlTokens,
  extractFuseQuery,
  normalizeDataset,
  getDomainRoot,
} from "./matchingHelper";
import Fuse, { FuseResult } from "fuse.js";
import { FuseResultV2, UrlToken } from "./types";

const fuseOptions = {
  // isCaseSensitive: false,
  includeScore: true,
  ignoreDiacritics: true,
  shouldSort: true,
  includeMatches: true,
  findAllMatches: true,
  minMatchCharLength: 4,
  location: 0,
  threshold: 0.1,
  distance: 100,
  useExtendedSearch: true,
  ignoreLocation: false,
  ignoreFieldNorm: true,
  // fieldNormWeight: 2,
  keys: [
    {
      name: "PageName",
      weight: 0.5,
    },
    {
      name: "Website",
      weight: 0.5,
    },
    {
      name: "Company",
      weight: 0.1,
    },
    {
      name: "Category",
      weight: 0.1,
    },
    {
      name: "ParentCompany",
      weight: 0.1,
    },
    {
      name: "Industry",
      weight: 0.1,
    },
    {
      name: "Type",
      weight: 0.1,
    },
    {
      name: "Description",
      weight: 0.1,
    },
    {
      name: "__searchable",
      weight: 0.7,
    },
  ],
};

export function matchByUrl(entiries: CargoEntry[], url: string): CargoEntry[] {
  const urlTokens: UrlToken[] = extractUrlTokens(url);
  const dataset: CargoEntry[] = normalizeDataset(entiries);
  const results: CargoEntry[] = [];

  for (const item of dataset) {
    urlTokens
      .filter((token) => token.source == "domain")
      .map((token) => {
        const website = item?.["Website"] ?? "";
        const domain = getDomainRoot(website);

        if (domain === token.value) {
          results.push(item);
        }
      });
  }

  return results.slice(0, 3);

  // Fuse.js
  // const fuse = new Fuse(dataset, fuseOptions);
  // const fusyQuery = extractFuseQuery(urlTokens);
  // console.log(`${Constants.LOG_PREFIX} Fuse.js queries: `, fusyQuery)

  // const combined = fuse.search(fusyQuery);
  // console.log(`${Constants.LOG_PREFIX} Fuse.js results: `, combined)
  // return combined.slice(0, 3).map((value) => value.item);

  // Fuse.js && Deterministic
  // const scored = [];
  // for (const item of dataset) {
  //   let score = 0;

  //   for (const token of urlTokens) {
  //     if (!token) continue;

  //     const fuse = new Fuse([item], fuseOptions);

  //     // Exact phrase match → high score
  //     if (item.__searchable.includes(token.value)) {
  //       score += token.weight;
  //     }

  //     if (fuse.search(token.value).length > 0) {
  //       score += token.weight;
  //     }
  //   }

  //   if (score > 0) {
  //     scored.push({ item, score });
  //   }
  // }
  // scored.sort((a, b) => b.score - a.score);
  // console.log(`${Constants.LOG_PREFIX} matchDeterministic results: `, scored);
  // return scored.slice(0, 3).map((value) => value.item);
}

/**
 * Fuzzy search logic types
 */

import { FuseResult } from "fuse.js";

export type UrlTokenSource = "domain" | "path" | "query";

export type UrlToken = {
  value: string;
  source: UrlTokenSource;
  depths?: number;
  weight: number;
};

export type FuseResultV2<T> = FuseResult<T> & {
  token: UrlToken;
};

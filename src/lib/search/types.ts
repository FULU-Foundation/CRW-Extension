/**
 * Fuzzy search logic types
 */

export type UrlTokenSource = "domain" | "path" | "query";

export type UrlToken = {
    value: string;
    source: UrlTokenSource;
    depths? : number;
    weight: number;
}
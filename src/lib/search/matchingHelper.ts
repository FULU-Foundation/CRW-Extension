import { CargoEntry } from "@/shared/types";
import { UrlToken } from "./types";
import * as Constants from "@/shared/constants";

const TLDs = new Set([
    "com",
    "net",
    "org",
    "io",
    "co",
    "uk",
    "de",
    "ru",
    "edu",
    "info",
    "gov",
    "app",
    "ai",
    "us",
    "au",
    "jp",
    "fr",
    "es",
    "it",
]);

function removeTLDs(tokens: string[]) {
    return tokens.filter((t) => !TLDs.has(t));
}

function tokenize(str: string) {
    if (!str) return [];
    return removeTLDs(str.split(/\s+/).filter(Boolean));
}

function normalize(str: string) {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .trim();
}

function filterStopWords(word: string) {
    const stopWords = new Set([
        "and",
        "or",
        "but",
        "which",
        "whether",
        "that",
        "this",
        "is",
        "are",
        "was",
        "were",
        "to",
        "for",
        "of",
        "in",
        "on",
        "a",
        "an",
        "the",
        "with",
        "as",
        "at",
        "by",
        "from",
        "it",
        "be",
        "if",
        "so",
        "then",
        "than",
        "because",
        "while",
        "where",
        "when",
    ]);

    return !stopWords.has(word);
}

function dedupe(arr: UrlToken[]) {
    return Array.from(new Set(arr));
}

function stripProtocol(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

export function getDomainRoot(rawUrl: string) {
    if (!rawUrl) return "";

    let hostname = rawUrl.trim().toLowerCase();

    hostname = hostname.replace(/^[a-z]+:\/\//, "");
    hostname = hostname.split("/")[0] || "";
    hostname = hostname.replace(/^www\./, "");

    if (!hostname.includes(".")) return hostname;

    const parts = hostname.split(".");
    const cleaned = removeTLDs(parts);

    return cleaned.slice(-1)[0] || "";
}


function extractQueryTokens(url: URL): UrlToken[] {
    const tokens = [];

    for (const [key, value] of url.searchParams.entries()) {
        if (!value) continue;

        const clean = normalize(value);
        const decoded = decodeURIComponent(clean).replace(/\+/g, " ");

        if (decoded.length < 4) continue;
        if (/^[0-9\s]+$/.test(decoded)) continue;
        if (/^[A-Za-z0-9_-]{10,}$/.test(decoded)) continue; // encoded tokens
        if (decoded.startsWith("http")) continue;

        if (/[a-zA-Z]/.test(decoded)) {
            const words = decoded.split(/\s+|,|;|\/|&|\band\b|\bor\b/gi);

            tokens.push(
                ...words
                    .map((w) => w.trim())
                    .filter(filterStopWords)
                    .filter(Boolean),
            );
        }
    }

    const results: UrlToken[] = [];
    const maxN = tokens.length;
    for (let n = 1; n <= maxN; n++) {
        for (let i = 0; i <= tokens.length - n; i++) {
            const slice = tokens.slice(i, i + n);

            results.push({
                value: slice.join(" "),
                source: "query",
                weight: n * 10 + (maxN - i) * 10, // weight = number of words
            });

            results.push({
                value: slice.join(""),
                source: "query",
                weight: n * 10 + (maxN - i) * 10, // weight = number of words
            });
        }
    }

    return results;
}

export function extractUrlTokens(rawUrl: string): UrlToken[] {
    console.log(`${Constants.LOG_PREFIX} Extract Url Tokens: `, rawUrl);

    const url = new URL(rawUrl.toLowerCase());

    // 1. Extract domain root (ford.com → ford)
    const domainRoot = getDomainRoot(rawUrl);
    console.log(`${Constants.LOG_PREFIX} Extract domain root: `, domainRoot);

    // 2. Extract meaningful path segments
    const rawSegments: string[] = `${url.pathname}/${url.hash}`
        .split("/")
        .filter((seg) => seg.length >= 3)
        .filter(filterStopWords)
        .filter(Boolean)
        .map((s) => normalize(decodeURIComponent(s)));
    console.log(`${Constants.LOG_PREFIX} Extract Path Raw Tokens: `, rawSegments);

    // Weight path segments based on depth → deeper = more specific
    const pathTokens: UrlToken[] = rawSegments
        .map(
            (seg: string, index: number) =>
                ({
                    value: seg,
                    source: "path",
                    weight: 4,
                }) as UrlToken,
        )
        .reverse();
    console.log(`${Constants.LOG_PREFIX} Extract Path Tokens: `, pathTokens);

    // 3. Extract query parameters
    const queryTokens = extractQueryTokens(url);
    console.log(`${Constants.LOG_PREFIX} Extract Query Tokens: `, queryTokens);

    // 4. Combine
    const allTokens: UrlToken[] = [
        ...pathTokens,
        ...queryTokens,
        { value: domainRoot, source: "domain", weight: 1 } as UrlToken,
    ].filter(Boolean);

    const uniqueTokens = Array.from(
        new Map(allTokens.map((t) => [t.value, t])).values(),
    );
    console.log(`${Constants.LOG_PREFIX} Unique Query Tokens: `, uniqueTokens);

    return uniqueTokens;
}

export function normalizeDataset(list: CargoEntry[]): CargoEntry[] {
    return list.map((item) => {
        const searchable = [
            item.PageName,
            item.Description,
            item.Company,
            item.Industry,
            item.Product,
            item.ProductLine,
            item.ParentCompany,
            item.Category,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .replace(/[^a-z0-9 ]/gi, "");

        return { ...item, __searchable: searchable };
    });
}

// Build a Fuse extended search query like:
//   'zigbee 'devices | 'brother 'printer
// Each UrlToken.value can contain multiple words.
export function extractFuseQuery(urlTokens: UrlToken[]): string {
    const groups = urlTokens
        .map((token) => token.value?.trim())
        .filter((value): value is string => Boolean(value))
        .map((value) =>
            value
                .split(/\s+/) // split by any whitespace
                .filter(Boolean)
                .map((word) => `${word}`) // Fuse extended exact-match: 'word
                .join(" "),
        )
        .filter(Boolean);

    return groups.join(" | ");
}

import { UrlToken } from "./types";

const TLDs = new Set([
    "com", "net", "org", "io", "co", "uk", "de", "ru", "edu", "info",
    "gov", "app", "ai", "us", "au", "jp", "fr", "es", "it"
]);

function removeTLDs(tokens: string[]) {
    return tokens.filter(t => !TLDs.has(t));
}

function tokenize(str: string) {
    if (!str) return [];
    return removeTLDs(
        str.split(/\s+/).filter(Boolean)
    );
}

function normalize(str: string) {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .trim();
}

function extractQueryTokens(url: URL) {
    const tokens = [];

    for (const [key, value] of url.searchParams.entries()) {
        if (!value) continue;

        const clean = normalize(value);
        tokens.push(...clean.split(/\s+/));
    }

    return tokens.filter(Boolean);
}

function dedupe(arr: UrlToken[]) {
    return Array.from(new Set(arr));
}

function stripProtocol(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

function getDomainRoot(hostname: string) {
    if (!hostname) return "";
    const clean = hostname.replace(/^www\./, "").toLowerCase();
    const parts = clean.split(".");

    return removeTLDs(parts).shift() || "";
}

export function extractUrlTokens(rawUrl: string) {
    const url = new URL(rawUrl.toLowerCase());

    // 1. Extract domain root (ford.com → ford)
    const domainRoot = getDomainRoot(url.hostname);

    // 2. Extract meaningful path segments
    const rawSegments: string[] = url.pathname
        .split("/")
        .filter(Boolean)
        .map((s => normalize(decodeURIComponent(s))));

    // Weight path segments based on depth → deeper = more specific
    const pathTokens: UrlToken[] = rawSegments
        .reverse()
        .filter(seg => seg.length >= 3)
        .map((seg: string, index: number) => ({
            value: seg,
            source: "path",
            weight: 3 + index // weight grows with depth
        } as UrlToken));

    // 3. Extract query parameters
    const queryTokens = extractQueryTokens(url);

    // 4. Combine
    const allTokens: UrlToken[] = [
        ...pathTokens,
        ...queryTokens.map(q => ({ value: q, source: "query", weight: 1 } as UrlToken)),
        { value: domainRoot, source: "domain", weight: 2 } as UrlToken,
    ].filter(Boolean);

    return allTokens
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
                .split(/\s+/)                // split by any whitespace
                .filter(Boolean)
                .map((word) => `'${word}`)   // Fuse extended exact-match: 'word
                .join(" ")
        )
        .filter(Boolean);

    return groups.join(" | ");
}
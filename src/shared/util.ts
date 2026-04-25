/**
 * general-purpose utilities
 */

/** Remove the start that matches `pre` */
export const stripPrefix = (s: string, pre: string) =>
	s.startsWith(pre) ? s.substring(pre.length) : s;

/** Remove the end that matches `suf` */
export const stripSuffix = (s: string, suf: string) =>
	s.endsWith(suf) && suf.length !== 0 ? s.slice(0, -suf.length) : s;

export const normalizeHostname = (hostname: string): string =>
	stripPrefix(hostname.trim().toLowerCase(), "www.");

export const splitWebsiteField = (website: unknown): string[] => {
  if (typeof website !== "string") return [];

  const values: string[] = [];
  const seen = new Set<string>();
  const pushIfUnique = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    values.push(trimmed);
  };

  const mediaWikiLinkPattern =
    /\[((?:https?:\/\/|www\.)[^\s\]]+)(?:\s+([^\]]+))?\]/gi;

  const remaining = website.replace(
    mediaWikiLinkPattern,
    (_match, target: string, label: string | undefined) => {
      pushIfUnique(target);

      const labelTrimmed = label?.trim() ?? "";
      if (/^(?:https?:\/\/|www\.)/i.test(labelTrimmed)) {
        pushIfUnique(labelTrimmed);
      }

      return " ";
    },
  );

  for (const value of remaining
    .split(/,(?=\s*(?:https?:\/\/|www\.))|\s+(?=(?:https?:\/\/|www\.))/i)
    .map((part) => part.trim())
    .filter(Boolean)) {
    pushIfUnique(value);
  }

  return values;
};

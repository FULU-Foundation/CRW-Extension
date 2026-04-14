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

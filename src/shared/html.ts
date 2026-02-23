const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export const decodeHtmlEntities = (value: string): string => {
  return value.replace(
    /&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g,
    (match, entity: string) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const codePoint = Number.parseInt(entity.slice(2), 16);
        if (Number.isNaN(codePoint)) return match;
        return String.fromCodePoint(codePoint);
      }

      if (entity.startsWith("#")) {
        const codePoint = Number.parseInt(entity.slice(1), 10);
        if (Number.isNaN(codePoint)) return match;
        return String.fromCodePoint(codePoint);
      }

      return NAMED_ENTITIES[entity] ?? match;
    },
  );
};

export const decodeEntityStrings = (value: unknown): unknown => {
  if (typeof value === "string") return decodeHtmlEntities(value);

  if (Array.isArray(value)) {
    return value.map((item) => decodeEntityStrings(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, item]) => {
      return [key, decodeEntityStrings(item)];
    });
    return Object.fromEntries(entries);
  }

  return value;
};

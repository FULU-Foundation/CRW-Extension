import he from "he";

export const decodeHtmlEntities = (value: string): string => {
  return he.decode(value);
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

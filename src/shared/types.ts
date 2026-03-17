/**
 * Cargo data types
 */
export type CargoEntryType = "Company" | "Incident" | "Product" | "ProductLine";

type CargoEntryCommon = {
  PageID: string;
  PageName: string;
  Description: string | null;
  [key: string]: unknown;
};

export type CompanyEntry = CargoEntryCommon & {
  _type: "Company";
  CompanyAlias?: string;
  Industry?: string;
  Website?: string;
};

export type IncidentEntry = CargoEntryCommon & {
  _type: "Incident";
  Company?: string;
  Product?: string;
  ProductLine?: string;
  StartDate?: string;
  Status?: string;
};

export type ProductEntry = CargoEntryCommon & {
  _type: "Product";
  Company?: string;
  ProductLine?: string;
  Website?: string;
};

export type ProductLineEntry = CargoEntryCommon & {
  _type: "ProductLine";
  Company?: string;
  Website?: string;
};

export type CargoEntry =
  | CompanyEntry
  | IncidentEntry
  | ProductEntry
  | ProductLineEntry;

export type RawCargoDataset = Record<CargoEntryType, unknown[]>;

export interface LoadResult {
  raw: RawCargoDataset;
  all: CargoEntry[];
}

/**
 * Content script logic types
 */

export interface PageContext {
  url: string;
  hostname: string;

  title?: string;
  meta?: Record<string, string>;
  textContent?: string;
  marketplaceProperties?: Record<string, string>;
}

const CARGO_ENTRY_TYPES: ReadonlyArray<CargoEntryType> = [
  "Company",
  "Incident",
  "Product",
  "ProductLine",
];

const KNOWN_STRING_FIELDS = [
  "PageID",
  "PageName",
  "Company",
  "Product",
  "ProductLine",
  "CompanyAlias",
  "Website",
  "Status",
  "StartDate",
  "Industry",
] as const;

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asOptionalString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const asDescription = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
};

const isCargoEntryType = (value: unknown): value is CargoEntryType => {
  return typeof value === "string" && CARGO_ENTRY_TYPES.includes(value as CargoEntryType);
};

export const decodeCargoEntry = (value: unknown): CargoEntry | null => {
  if (!isObjectRecord(value)) return null;
  if (!isCargoEntryType(value._type)) return null;

  const pageId = asOptionalString(value.PageID);
  const pageName = asOptionalString(value.PageName);
  if (!pageId || !pageName) return null;

  const next: Record<string, unknown> = { ...value };
  next._type = value._type;
  next.PageID = pageId;
  next.PageName = pageName;
  next.Description = asDescription(value.Description);

  for (const field of KNOWN_STRING_FIELDS) {
    if (field === "PageID" || field === "PageName") continue;
    const stringValue = asOptionalString(value[field]);
    if (stringValue === undefined) {
      delete next[field];
      continue;
    }
    next[field] = stringValue;
  }

  return next as CargoEntry;
};

export const decodeCargoEntries = (value: unknown): CargoEntry[] => {
  if (!Array.isArray(value)) return [];
  const entries: CargoEntry[] = [];
  for (const item of value) {
    const decoded = decodeCargoEntry(item);
    if (!decoded) continue;
    entries.push(decoded);
  }
  return entries;
};

export const decodePageContext = (value: unknown): PageContext | null => {
  if (!isObjectRecord(value)) return null;
  if (typeof value.url !== "string") return null;
  if (typeof value.hostname !== "string") return null;

  const next: PageContext = {
    url: value.url,
    hostname: value.hostname,
  };

  if (typeof value.title === "string") next.title = value.title;
  if (typeof value.textContent === "string") next.textContent = value.textContent;

  const decodeStringRecord = (
    recordValue: unknown,
  ): Record<string, string> | undefined => {
    if (!isObjectRecord(recordValue)) return undefined;
    const record: Record<string, string> = {};
    for (const [key, item] of Object.entries(recordValue)) {
      if (typeof item !== "string") continue;
      record[key] = item;
    }
    return Object.keys(record).length > 0 ? record : undefined;
  };

  const meta = decodeStringRecord(value.meta);
  if (meta) next.meta = meta;

  const marketplaceProperties = decodeStringRecord(value.marketplaceProperties);
  if (marketplaceProperties) next.marketplaceProperties = marketplaceProperties;

  return next;
};

export const isCompanyEntry = (entry: CargoEntry): entry is CompanyEntry => {
  return entry._type === "Company";
};

export const isIncidentEntry = (entry: CargoEntry): entry is IncidentEntry => {
  return entry._type === "Incident";
};

export const isProductEntry = (entry: CargoEntry): entry is ProductEntry => {
  return entry._type === "Product";
};

export const isProductLineEntry = (
  entry: CargoEntry,
): entry is ProductLineEntry => {
  return entry._type === "ProductLine";
};

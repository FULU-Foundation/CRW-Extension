/**
 * Cargo data types
 */
export type CargoEntryType =
  | "Company"
  | "Incident"
  | "Product"
  | "ProductLine";

export interface CargoEntry {
    _type: CargoEntryType;
    [key: string]: any;
}

export interface LoadResult {
    raw: any;
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
}
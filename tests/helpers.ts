import type { CargoEntry } from "../src/shared/types.ts";

export const entry = (
  overrides: Partial<CargoEntry> & Pick<CargoEntry, "PageID" | "PageName">,
): CargoEntry => {
  return {
    _type: "Company",
    PageID: overrides.PageID,
    PageName: overrides.PageName,
    Description: overrides.Description ?? null,
    ...overrides,
  };
};

export const relationFixture = (): CargoEntry[] => {
  return [
    entry({
      _type: "Company",
      PageID: "company-acme",
      PageName: "Acme",
      Website: "https://acme.com/",
    }),
    entry({
      _type: "ProductLine",
      PageID: "pl-acme-home",
      PageName: "Acme Home",
      Company: "Acme",
    }),
    entry({
      _type: "Product",
      PageID: "product-acme-cam",
      PageName: "Acme Cam",
      Company: "Acme",
      ProductLine: "Acme Home",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-acme-breach",
      PageName: "Acme Breach 2025",
      Company: "Acme",
      Product: "Acme Cam",
      ProductLine: "Acme Home",
    }),
    entry({
      _type: "Company",
      PageID: "company-other",
      PageName: "OtherCorp",
      Website: "https://other.example/",
    }),
  ];
};

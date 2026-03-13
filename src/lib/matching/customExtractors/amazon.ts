import type { CustomExtractorProperties } from "./types.ts";

const normalizePropertyLabel = (value: string): string => {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[:\s]+/g, " ")
    .trim()
    .toLowerCase();
};

const normalizePropertyValue = (value: string): string => {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const applyLabelValuePair = (
  output: CustomExtractorProperties,
  label: string,
  value: string,
) => {
  if (!value) return;
  if (label === "brand" && !output.brandName) output.brandName = value;
  if (label === "manufacturer" && !output.manufacturerName) {
    output.manufacturerName = value;
  }
};

const extractAmazonMarketplaceProperties = (
  doc: Document,
  hostname: string,
): CustomExtractorProperties | undefined => {
  void hostname;
  const output: CustomExtractorProperties = {};

  for (const row of Array.from(doc.querySelectorAll("tr"))) {
    const cells = row.querySelectorAll("th, td");
    if (cells.length < 2) continue;
    const label = normalizePropertyLabel(cells[0]?.textContent || "");
    const value = normalizePropertyValue(cells[1]?.textContent || "");
    applyLabelValuePair(output, label, value);
    if (output.brandName && output.manufacturerName) break;
  }

  if (!output.brandName || !output.manufacturerName) {
    for (const listItem of Array.from(doc.querySelectorAll("li"))) {
      const text = normalizePropertyValue(listItem.textContent || "");
      if (!text.includes(":")) continue;
      const [rawLabel, ...rest] = text.split(":");
      if (!rawLabel || rest.length === 0) continue;
      const label = normalizePropertyLabel(rawLabel);
      const value = normalizePropertyValue(rest.join(":"));
      applyLabelValuePair(output, label, value);
      if (output.brandName && output.manufacturerName) break;
    }
  }

  if (!output.brandName && !output.manufacturerName) return undefined;
  return output;
};

export default extractAmazonMarketplaceProperties;

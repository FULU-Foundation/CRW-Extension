# Custom Extractors

Custom extractors are optional. Add one only when default metadata matching is not enough.

## Use a Custom Extractor When
- Product pages do not expose useful `schema.org` Product JSON-LD.
- JSON-LD is present but missing or incorrect for `brand` / `manufacturer`.
- Site-specific DOM properties are reliable and materially improve ranking quality.

If metadata and JSON-LD are good, do not add a custom extractor.

## Convention
Create a file at:

`src/lib/matching/customExtractors/<family>.ts`

Where `<family>` matches the ecommerce family key in `matchingConfig.ecommerceDomainFamilyMap`.

Example:    

`src/lib/matching/customExtractors/arukereso.ts`

The file must default-export a function with this shape:

```ts
import type { CustomExtractorProperties } from "@/lib/matching/customExtractors/types";

export default function extractArukeresoMarketplaceProperties(
  doc: Document,
  hostname: string,
): CustomExtractorProperties | undefined {
  void hostname;
  return undefined;
}
```

The loader resolves extractors by filename convention, so no manual import/wiring is required.

## Contract
Return only normalized marketplace properties that affect matching:
- `productName`
- `brandName`
- `manufacturerName`

Rules:
- Return `undefined` when no usable values are found.
- Trim whitespace and avoid empty strings.
- Do not return unrelated fields. Only these three keys are supported.

## Required Tests
For any new custom extractor, add tests that prove:
- extractor returns expected properties from representative HTML snippets
- empty/malformed pages return `undefined`
- matching behavior improves only when intended

Run:

```shell
npm run lint
npm test
```

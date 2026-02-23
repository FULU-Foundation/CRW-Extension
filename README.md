![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

# CRW-Extension

Browser extension that shows a popup and notifications when the site, product, or service you're viewing has an article on the Consumer Rights Wiki.

## About

This project is under active development.  
All references found by this software are not part of CRW Extension and are provided to the end-user under **CC BY-SA 4.0** licensing by the originating site [consumerrights.wiki](https://consumerrights.wiki).

## Contributing

Contributions are welcome!

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on how to ask questions, report bugs, suggest enhancements, and submit Pull Requests.  
You can also check the [project board](https://github.com/FULU-Foundation/CRW-Extension/projects) and look for issues labelled **good first issue** to get started.

# Development

## Clone and build the extension:

### Chrome & Firefox

```shell
git clone https://github.com/FULU-Foundation/CRW-Extension.git
cd CRW-Extension
npm ci
npm run build:watch
```

The compiled extension will be output in the `dist` folder and vite will watch for changes and update the extension automatically.

## Development Installation

### For Chrome:

1. Open Extension settings: e.g. `chrome://extensions/` or `brave://extensions/` etc.
2. Enable Developer Mode
3. Click `Load Unpacked`
4. Navigate to the unzipped folder.

### For Firefox:

1. Open: about:debugging#/runtime/this-firefox
2. Expand 'Temporary Extensions'
3. Click 'Load Temporary Add-on...'
4. Navigate to the unzipped folder and open `manifest.json`

## Formatting

```shell
npm run format
```

## URL Match Preview Script

Use the URL match preview script to inspect URL seed matches and related-entry expansion against the local `all_cargo_combined.json` dataset.

### Run against a specific URL

```shell
npm run match:preview -- "https://www.amazon.com/example-product"
```

### Run built-in examples from Cargo website fields

```shell
npm run match:preview -- --examples
```

### Optional flags

- `--limit=<n>`: max seed URL matches to return (default: `20`)
- `--relations-limit=<n>`: max related expansion rows shown in the table (default: `50`)
- `--max-examples=<n>`: max example URLs to run when using `--examples` (default: `25`)

Example with limits:

```shell
npm run match:preview -- "https://www.apple.com/airpods-max/" --limit=10 --relations-limit=25
```

## Verify Cargo URL Matching

Use the matching verification script to download the current Cargo dataset and verify that each Cargo entry's `Website` URL(s) can match back to that same entry using the extension's URL matcher.

```shell
npm run verify:matching
```

The script prints a summary and then lists any Cargo entries with:

- invalid `Website` URL values
- `Website` URL(s) that do not produce a self-match

It exits with a non-zero status when any failures are found.

## Compare Subdomain Matching (Testing)

Use this testing script to compare Cargo URL matches with `enableSubdomainMatching` disabled vs enabled, and print the differences.

### Run against all Cargo `Website` URLs

```shell
npm run match:compare-subdomains
```

### Run against a specific URL

```shell
npm run match:compare-subdomains -- "https://optus.com.au/"
```

### Optional flags

- `--limit=<n>`: max URL matches to compare per URL (default: `10`)
- `--max-diffs=<n>`: max changed URL comparisons to print (default: `25`)
- `--include-unchanged`: print all URL comparisons, not just changed ones

## Compare Cross-TLD Matching (Testing)

Use this testing script to compare Cargo URL matches with `enableMatchAcrossTLDs` disabled vs enabled (for cases like `dyson.com` / `dyson.co.uk` / `dyson.com.au`).

### Run against all Cargo `Website` URLs

```shell
npm run match:compare-tlds
```

### Run against a specific URL

```shell
npm run match:compare-tlds -- "https://www.dyson.com.au/"
```

### Optional flags

- `--limit=<n>`: max URL matches to compare per URL (default: `10`)
- `--max-diffs=<n>`: max changed URL comparisons to print (default: `25`)
- `--include-unchanged`: print all URL comparisons, not just changed ones

## Matching Configuration (`src/lib/matching/matchingConfig.ts`)

The URL matcher behavior is controlled by the exported `matchingConfig` object in `src/lib/matching/matchingConfig.ts`. You can override values at runtime with `setMatchingConfig(...)` and restore defaults with `resetMatchingConfig()`.

### Top-level params

- `enableSubdomainMatching` (`boolean`, default: `true`): allows matches when the visited URL and candidate URL share the same root domain but use different subdomains (for example `support.example.com` vs `example.com`). Produces a `subdomain` match.
- `enableMatchAcrossTLDs` (`boolean`, default: `true`): allows cross-TLD alias matches for the same domain label when the suffix is compound and the registrable domains differ (for example `dyson.co.uk` vs `dyson.com.au`). Produces a `subdomain` match with a `cross_tld_alias` reason.
- `enableEcommerceFamilyAliasMatching` (`boolean`, default: `true`): allows known ecommerce domains in the same configured family (Amazon, eBay, etc.) to match each other across country domains. Produces a `subdomain` match with an `ecommerce_family_alias` reason.
- `urlSeedLimit` (`number`, default: `3`): default limit intended for URL-seed matching workflows.
- `metaSeedLimit` (`number`, default: `5`): default limit intended for metadata-seed matching workflows.
- `pageContextMinEntityNameLength` (`number`, default: `3`): minimum entity-name length intended for page-context matching/scoring workflows.
- `marketplaceBrandDenylist` (`string[]`, default: `["amazon", "ebay"]`): brand names intended to be excluded from page-context brand extraction/scoring.
- `specificPathDomainMatches` (`string[]`, default: `["github.com"]`): hostnames for which the matcher keeps only the most specific exact/partial path match per host (for example deeper GitHub repo/org paths win over broader `github.com/` matches).
- `ecommerceDomainFamilyMap` (`Record<string, string>`): maps known ecommerce domains to a family alias used by `enableEcommerceFamilyAliasMatching` (for example many `amazon.*` domains map to `"amazon"`, many `ebay.*` domains map to `"ebay"`).

### Nested params

- `urlMatchPriority.exact` (`number`, default: `3`): relative priority for exact host + path matches.
- `urlMatchPriority.partial` (`number`, default: `2`): relative priority for exact host + path-prefix matches.
- `urlMatchPriority.subdomain` (`number`, default: `1`): relative priority for subdomain/cross-TLD/ecommerce-family matches.
- `pageContextWeights.title` (`number`, default: `10`): weight for page `<title>` text in page-context scoring.
- `pageContextWeights.metaTitle` (`number`, default: `9`): weight for metadata title fields in page-context scoring.
- `pageContextWeights.description` (`number`, default: `6`): weight for page/meta description text in page-context scoring.
- `pageContextWeights.ogTitle` (`number`, default: `9`): weight for Open Graph title text in page-context scoring.
- `pageContextWeights.ogDescription` (`number`, default: `6`): weight for Open Graph description text in page-context scoring.
- `pageContextTypeBoosts.company` (`number`, default: `3`): score boost for entities typed as companies in page-context scoring.
- `pageContextTypeBoosts.productLine` (`number`, default: `4`): score boost for entities typed as product lines in page-context scoring.
- `pageContextTypeBoosts.product` (`number`, default: `4`): score boost for entities typed as products in page-context scoring.

### Current usage notes

- URL matching currently uses `enableSubdomainMatching`, `enableMatchAcrossTLDs`, `enableEcommerceFamilyAliasMatching`, `specificPathDomainMatches`, and `ecommerceDomainFamilyMap`.
- The page-context and seed-limit params are defined in config now for matching/scoring workflows, but are not currently read by `src/lib/matching/urlMatching.ts`.

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

## Add Ecommerce Site

Use this script to register a new ecommerce family/domain mapping in `matchingConfig`.

```shell
npm run ecommerce:add -- --family=arukereso --domains=arukereso.hu
```

Custom metadata extractors are also supported when default page metadata and schema.org Product JSON-LD are insufficient. See [Custom Extractors](custom_extractor.md) for the extractor contract and convention-based wiring.

### Optional flags

- `--dry-run`: preview changes without writing files
- `--config-path=<file>`: override the default config file path (`src/lib/matching/matchingConfig.ts`)

## Verify Cargo URL Matching

Use the matching verification script to download the current Cargo dataset and verify that each Cargo entry's `Website` URL(s) can match back to that same entry using the extension's URL matcher.

```shell
npm run verify:matching
```

The script prints a summary and then lists any Cargo entries with:

- invalid `Website` URL values
- `Website` URL(s) that do not produce a self-match

It exits with a non-zero status when any failures are found.

## Verify Cargo Quality

Use the Cargo quality verification script to fetch the latest Cargo export and check fields that affect popover quality and matching reliability (for example descriptions, incident status/date fields, and short matching/reference values).

By default, the script fetches the latest dataset from the remote Cargo export URL. You can optionally override the input with `--input <file>` for local testing.

It exits with a non-zero status when any quality issues are found.

### Text output (console)

This prints an ASCII matrix to the terminal with `✅` / `❌` / `-` indicators and quality-check definitions at the top.

```shell
npm run verify:cargo-quality
```

### Wiki markup output (file)

This writes a wiki table matrix with `{{Tick}}` / `{{Cross}}` / `-` markers and linked page names.

When passing flags through `npm run`, use `--` before the script flags:

```shell
npm run verify:cargo-quality -- --format wiki --out cargo-quality-report.wiki
```

### Optional flags

- `--format text|wiki`: output as console text matrix (`text`) or wiki markup file (`wiki`) (default: `text`)
- `--out <file>`: wiki output file path (used with `--format wiki`; default: `cargo-popover-validation.wiki`)
- `--input <file>`: use a local Cargo JSON file instead of fetching the latest remote export
- `--min-match-length <n>`: matching-length threshold used for short-name/reference checks (default: `2`)

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

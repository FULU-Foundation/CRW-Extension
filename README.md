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
npm run match:preview -- "https://github.com/FULU-Foundation/CRW-Extension" --limit=10 --relations-limit=25
```

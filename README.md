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

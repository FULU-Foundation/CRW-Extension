![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
# CRW-Extension
Browser extension that shows a popup and notifications when the site, product, or service you're viewing has an article on the Consumer Rights Wiki.
## Install
- Install on Chrome, Edge and Brave
  https://chromewebstore.google.com/detail/consumer-rights-wiki/bppajinomefndbbmopljhbdfefnefdha
- Install on Firefox
  https://addons.mozilla.org/firefox/addon/consumer-rights-wiki/
- Safari support is available as a WebExtension bundle for temporary loading in Safari during development, and can also be packaged for distribution with Apple tooling.
## Contributing
### Technical Contributions
Contributions are welcome!
Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on how to ask questions, report bugs, suggest enhancements, and submit Pull Requests.
> [!IMPORTANT]
> Before opening an issue or bug report, please ensure you have read [CONTRIBUTING.md](CONTRIBUTING.md) carefully. **Issues that do not follow the guidelines will be closed without review.**
### Editorial and Wiki Contributions
The extension matches sites and services against data sourced from the [Consumer Rights Wiki](https://consumerrights.wiki). You can contribute in two ways:
- **Editorial** - Help improve or add articles directly on the [Consumer Rights Wiki](https://consumerrights.wiki)
- **Cargo data** - Help add structured metadata that powers the extension's matching. You can help by contributing data at the [Cargo completion project](https://consumerrights.wiki/w/Projects:Cargo-complete). A [daily Cargo report](https://consumerrights.wiki/w/Projects:Cargo-complete/report) is also available, which tracks data quality and helps ensure the extension's matching is as accurate as possible.
### Community & Discussions
Have a question, idea, or just want to connect with other users? Head over to [Discussions](https://github.com/FULU-Foundation/CRW-Extension/discussions) to get involved.
# Development
## Clone and build the extension:
### Chrome, Firefox & Safari bundle
```shell
git clone https://github.com/FULU-Foundation/CRW-Extension.git
cd CRW-Extension
npm ci
npm run build
```
The compiled extension will be output in the `dist` folder. Alternatively run ```npm run build:watch``` and vite will watch for changes and update the extension automatically during development.
Linux is sufficient for `dist/chrome`, `dist/firefox`, and `dist/safari`. Safari packaging for distribution still requires Apple tooling.

### Safari packaging for distribution
```shell
npm run build-safari
npm run package-safari
```
This generates an Xcode project under `build/safari` using `xcrun safari-web-extension-converter`. Override the defaults with `SAFARI_APP_NAME`, `SAFARI_BUNDLE_IDENTIFIER`, `SAFARI_PROJECT_LOCATION`, or `SAFARI_EXTENSION_DIR` if needed.
If the converter reports that required plugins failed to load, run `sudo xcodebuild -runFirstLaunch` once and retry.
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
### For Safari:
1. Run `npm run build-safari`.
2. In Safari on macOS, enable the Develop menu if it is not already visible.
3. Use Safari's temporary web extension install flow and select the [`dist/safari`](/Users/jdumay/code/CRW-Extension/dist/safari) folder.
4. Enable the extension in Safari settings if prompted.
5. On first install, the extension opens a tab with Safari-specific setup instructions.
6. Set the extension's website access to `All Websites` so it can inspect the current site automatically.
## Formatting
```shell
npm run format
```
## Disclaimer
The source code for the CRW Extension is licensed under the MIT License.

All references found by this software are not part of CRW Extension and are provided to the end-user under **CC BY-SA 4.0** licensing by the originating site [consumerrights.wiki](https://consumerrights.wiki).

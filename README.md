![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
# CRW-Extension
Browser extension that notifies you when the site, product, or service you're viewing has an article on the Consumer Rights Wiki.

When a match is found, a compact pill-shaped badge appears unobtrusively in the corner of your screen showing the matched entry name and an incident count if any active incidents exist. Clicking the pill expands it into the full article card, which opens in a position calculated to always stay fully on-screen. The pill can also be dragged and repositioned anywhere on the screen. Clicking × on the pill dismisses it for the current page.

## Goal
The aim of this fork is to improve the user experience of the original extension in two ways. First, to replace the full-sized popup that appears automatically on every matched page with a compact, collapsible pill-shaped notification that stays out of the way until the user chooses to interact with it. Second, to reduce notification frequency so the pill only appears when there is an active incident report associated with the matched entry, rather than on every match regardless of whether anything actionable is present.

## Changes made
- **Collapsed by default** — the notification no longer opens as a full popup card automatically. It appears as a small pill in the corner of the screen instead.
- **Incident-only notifications** — the pill only appears when the matched entry has one or more active incident reports. Pages that match an entry with no incidents no longer trigger a notification.
- **Expandable on demand** — clicking the pill opens the full article card. The card is smart-positioned to avoid being cut off at screen edges, flipping its anchor point based on where the pill is located on screen.
- **Draggable pill** — the pill can be freely repositioned anywhere on screen by clicking and dragging. Position resets on each new page load.
- **Dismiss without suppressing** — clicking × on the pill closes it for the current page without permanently suppressing alerts for that site, preserving all existing snooze and suppress options inside the expanded card.

## Install
- Install on Chrome, Edge and Brave
  https://chromewebstore.google.com/detail/consumer-rights-wiki/bppajinomefndbbmopljhbdfefnefdha
- Install on Firefox
  https://addons.mozilla.org/firefox/addon/consumer-rights-wiki/
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
### Chrome & Firefox
```shell
git clone https://github.com/FULU-Foundation/CRW-Extension.git
cd CRW-Extension
npm ci
npm run build
```
The compiled extension will be output in the `dist` folder. Alternatively run ```npm run build:watch``` and vite will watch for changes and update the extension automatically during development.
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
## Disclaimer
The source code for the CRW Extension is licensed under the MIT License.

All references found by this software are not part of CRW Extension and are provided to the end-user under **CC BY-SA 4.0** licensing by the originating site [consumerrights.wiki](https://consumerrights.wiki).

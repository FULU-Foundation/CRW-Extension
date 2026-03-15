import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

if (process.platform !== "darwin") {
  console.error(
    "Safari packaging requires macOS because it depends on Xcode's safari-web-extension-converter.",
  );
  process.exit(1);
}

const extensionPath = path.resolve(
  process.env.SAFARI_EXTENSION_DIR ?? "dist/safari",
);
const projectLocation = path.resolve(
  process.env.SAFARI_PROJECT_LOCATION ?? "build/safari",
);
const appName = process.env.SAFARI_APP_NAME ?? "Consumer Rights Wiki";
const bundleIdentifier =
  process.env.SAFARI_BUNDLE_IDENTIFIER ?? "wiki.consumerrights.extension";

if (!fs.existsSync(extensionPath)) {
  console.error(
    `Safari extension bundle not found at ${extensionPath}. Run npm run build-safari first.`,
  );
  process.exit(1);
}

fs.mkdirSync(projectLocation, { recursive: true });

const args = [
  "safari-web-extension-converter",
  extensionPath,
  "--project-location",
  projectLocation,
  "--app-name",
  appName,
  "--bundle-identifier",
  bundleIdentifier,
  "--macos-only",
  "--copy-resources",
  "--swift",
  "--no-open",
  "--no-prompt",
  "--force",
];

console.log(`Packaging Safari project from ${extensionPath}`);
console.log(`Output location: ${projectLocation}`);
console.log(`App name: ${appName}`);
console.log(`Bundle identifier: ${bundleIdentifier}`);

execFileSync("xcrun", args, { stdio: "inherit" });

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

if (process.platform !== "darwin") {
  console.error("Safari signing requires macOS and Xcode.");
  process.exit(1);
}

const projectLocation = path.resolve(
  process.env.SAFARI_PROJECT_LOCATION ?? "build/safari",
);
const appName = process.env.SAFARI_APP_NAME ?? "Consumer Rights Wiki";
const projectPath =
  process.env.SAFARI_XCODE_PROJECT != null
    ? path.resolve(process.env.SAFARI_XCODE_PROJECT)
    : findFirstXcodeProject(projectLocation);
const scheme = process.env.SAFARI_XCODE_SCHEME ?? appName;
const configuration = process.env.SAFARI_XCODE_CONFIGURATION ?? "Release";
const archivePath = path.resolve(
  process.env.SAFARI_ARCHIVE_PATH ?? `build/safari/archive/${appName}.xcarchive`,
);
const exportPath = path.resolve(
  process.env.SAFARI_EXPORT_PATH ?? "build/safari/export",
);
const teamId = process.env.APPLE_DEVELOPMENT_TEAM;
const exportMethod = process.env.SAFARI_EXPORT_METHOD;
const signingStyle = process.env.SAFARI_SIGNING_STYLE ?? "automatic";
const allowProvisioningUpdates =
  process.env.SAFARI_ALLOW_PROVISIONING_UPDATES === "true";

if (!fs.existsSync(projectPath)) {
  console.error(`Safari Xcode project not found: ${projectPath}`);
  process.exit(1);
}

if (!teamId) {
  console.error("APPLE_DEVELOPMENT_TEAM is required for Safari signing.");
  process.exit(1);
}

if (!exportMethod) {
  console.error(
    "SAFARI_EXPORT_METHOD is required, for example 'app-store' or 'developer-id'.",
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(archivePath), { recursive: true });
fs.mkdirSync(exportPath, { recursive: true });

const exportOptionsPlistPath = path.join(
  os.tmpdir(),
  `crw-safari-export-options-${Date.now()}.plist`,
);

fs.writeFileSync(
  exportOptionsPlistPath,
  createExportOptionsPlist({
    teamId,
    method: exportMethod,
    signingStyle,
  }),
);

const archiveArgs = [
  "xcodebuild",
  "archive",
  "-project",
  projectPath,
  "-scheme",
  scheme,
  "-configuration",
  configuration,
  "-archivePath",
  archivePath,
  "DEVELOPMENT_TEAM=" + teamId,
  "CODE_SIGN_STYLE=" + capitalize(signingStyle),
];

if (allowProvisioningUpdates) {
  archiveArgs.push("-allowProvisioningUpdates");
}

const exportArgs = [
  "xcodebuild",
  "-exportArchive",
  "-archivePath",
  archivePath,
  "-exportPath",
  exportPath,
  "-exportOptionsPlist",
  exportOptionsPlistPath,
];

if (allowProvisioningUpdates) {
  exportArgs.push("-allowProvisioningUpdates");
}

console.log(`Signing Safari app from project: ${projectPath}`);
console.log(`Scheme: ${scheme}`);
console.log(`Configuration: ${configuration}`);
console.log(`Archive path: ${archivePath}`);
console.log(`Export path: ${exportPath}`);
console.log(`Export method: ${exportMethod}`);
console.log(`Team ID: ${teamId}`);

try {
  execFileSync("xcrun", archiveArgs, { stdio: "inherit" });
  execFileSync("xcrun", exportArgs, { stdio: "inherit" });
} finally {
  fs.rmSync(exportOptionsPlistPath, { force: true });
}

function findFirstXcodeProject(root: string): string {
  if (!fs.existsSync(root)) {
    console.error(
      `Safari project location does not exist: ${root}. Run npm run package-safari first.`,
    );
    process.exit(1);
  }

  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory() && entry.name.endsWith(".xcodeproj")) {
        return entryPath;
      }
      if (entry.isDirectory()) {
        stack.push(entryPath);
      }
    }
  }

  console.error(
    `No .xcodeproj found under ${root}. Run npm run package-safari first.`,
  );
  process.exit(1);
}

function createExportOptionsPlist(input: {
  teamId: string;
  method: string;
  signingStyle: string;
}): string {
  const { teamId, method, signingStyle } = input;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${escapeXml(method)}</string>
  <key>signingStyle</key>
  <string>${escapeXml(signingStyle)}</string>
  <key>teamID</key>
  <string>${escapeXml(teamId)}</string>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

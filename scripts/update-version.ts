import fs from "node:fs";

const releaseVersion = process.env.RELEASE_VERSION;
const amoExtensionId = process.env.AMO_EXTENSION_ID;

if (!releaseVersion) {
  console.error("RELEASE_VERSION is required");
  process.exit(1);
}

const updateJsonVersion = (filePath: string) => {
  const value = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;

  value.version = releaseVersion;

  if (filePath === "manifest/firefox.json" && amoExtensionId) {
    const browserSpecificSettings =
      (value.browser_specific_settings as Record<string, unknown> | undefined) ??
      {};
    const gecko = (browserSpecificSettings.gecko as Record<string, unknown> | undefined) ?? {};

    gecko.id = amoExtensionId;
    browserSpecificSettings.gecko = gecko;
    value.browser_specific_settings = browserSpecificSettings;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

console.log(`Using release version: ${releaseVersion}`);
updateJsonVersion("package.json");
updateJsonVersion("manifest/chrome.json");
updateJsonVersion("manifest/firefox.json");

import fs from "node:fs/promises";
import path from "node:path";
import * as prettier from "prettier";
import { runEcommerceAdd } from "./lib/ecommerce-add.ts";

const printUsage = () => {
  console.log(
    [
      "Usage:",
      "  npm run ecommerce:add -- --family=<slug> --domains=<csv> [--dry-run] [--config-path=<file>]",
      "",
      "Example:",
      "  npm run ecommerce:add -- --family=arukereso --domains=arukereso.hu",
    ].join("\n"),
  );
};

const parseArgs = (argv: string[]) => {
  const readArgValue = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const entry = argv.find((value) => value.startsWith(prefix));
    if (!entry) return undefined;
    return entry.slice(prefix.length);
  };

  const family = readArgValue("family");
  const domains = readArgValue("domains");
  const configPath =
    readArgValue("config-path") ?? "src/lib/matching/matchingConfig.json";
  const dryRun = argv.includes("--dry-run");

  if (!family || !domains) {
    throw new Error("Both --family and --domains are required.");
  }

  return {
    family,
    domains: domains.split(","),
    dryRun,
    configPath,
  };
};

const formatFileWithPrettier = async (filePath: string): Promise<void> => {
  const source = await fs.readFile(filePath, "utf8");
  const prettierConfig = (await prettier.resolveConfig(filePath)) ?? {};
  const formatted = await prettier.format(source, {
    ...prettierConfig,
    filepath: filePath,
  });

  if (formatted !== source) {
    await fs.writeFile(filePath, formatted);
  }
};

const run = async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    const resolvedConfigPath = path.resolve(process.cwd(), args.configPath);

    const result = await runEcommerceAdd({
      family: args.family,
      domains: args.domains,
      dryRun: args.dryRun,
      readSource: () => fs.readFile(resolvedConfigPath, "utf8"),
      writeSource: (nextSource) => fs.writeFile(resolvedConfigPath, nextSource),
    });

    if (!result.changed) {
      console.log(`No changes needed for family "${result.family}".`);
      return;
    }

    if (!args.dryRun) {
      await formatFileWithPrettier(resolvedConfigPath);
    }

    const modeLabel = args.dryRun
      ? "Dry run completed"
      : "Updated matching config";
    console.log(`${modeLabel} for family "${result.family}".`);
    if (result.addedDomains.length > 0) {
      console.log(`Added domains: ${result.addedDomains.join(", ")}`);
    }
    if (result.addedToDenylist) {
      console.log(
        `Added "${result.family}" to marketplaceBrandDenylist in matchingConfig.json.`,
      );
    }
    if (args.dryRun) {
      console.log("No files were written.");
    } else {
      console.log("Formatted matchingConfig.json with Prettier.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    printUsage();
    process.exitCode = 1;
  }
};

void run();

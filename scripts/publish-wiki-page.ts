import { readFile } from "node:fs/promises";

import * as mwn from "mwn";

type Args = {
  apiUrl: string;
  pageTitle: string;
  filePath: string;
  summary: string;
};

const DEFAULT_API_URL = "https://consumerrights.wiki/api.php";
const DEFAULT_SUMMARY = "Update page from CI";

const usage = [
  "Usage:",
  "  node --experimental-strip-types scripts/publish-wiki-page.ts --file <path> --page <title> [--summary <text>] [--api-url <url>]",
].join("\n");

const parseArgs = (argv: string[]): Args => {
  let apiUrl = DEFAULT_API_URL;
  let pageTitle = "";
  let filePath = "";
  let summary = DEFAULT_SUMMARY;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }

    if (arg === "--api-url") {
      if (!next) throw new Error("Missing value for --api-url");
      apiUrl = next;
      index += 1;
      continue;
    }

    if (arg === "--page") {
      if (!next) throw new Error("Missing value for --page");
      pageTitle = next;
      index += 1;
      continue;
    }

    if (arg === "--file") {
      if (!next) throw new Error("Missing value for --file");
      filePath = next;
      index += 1;
      continue;
    }

    if (arg === "--summary") {
      if (!next) throw new Error("Missing value for --summary");
      summary = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!pageTitle) throw new Error("Missing required --page argument");
  if (!filePath) throw new Error("Missing required --file argument");

  return {
    apiUrl,
    pageTitle,
    filePath,
    summary,
  };
};

const getRequiredEnv = (
  name: "WIKI_USERNAME" | "WIKI_BOTNAME" | "WIKI_PASSWORD",
): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const publishPage = async (args: Args) => {
  const wikiUsername = getRequiredEnv("WIKI_USERNAME");
  const wikiBotname = getRequiredEnv("WIKI_BOTNAME");
  const wikiPassword = getRequiredEnv("WIKI_PASSWORD");
  const text = await readFile(args.filePath, "utf8");
  const { Mwn } = mwn;

  const bot = new Mwn({
    apiUrl: args.apiUrl,
    username: `${wikiUsername}@${wikiBotname}`,
    password: wikiPassword,
    silent: true,
  });

  await bot.login();
  await bot.save(args.pageTitle, text, args.summary, { bot: true });
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  await publishPage(args);
  console.log(`Published wiki page "${args.pageTitle}" from ${args.filePath}`);
};

void run().catch((error) => {
  console.error("publish-wiki-page failed");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  console.error("");
  console.error(usage);
  process.exitCode = 1;
});

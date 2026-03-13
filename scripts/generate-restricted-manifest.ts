#!/usr/bin/env node
/**
 * Generate restricted manifest files with explicit domain permissions
 * instead of <all_urls> for enhanced privacy
 */

import fs from "fs";
import path from "path";

const DATASET_URL =
  "https://raw.githubusercontent.com/FULU-Foundation/CRW-Extension/refs/heads/export_cargo/all_cargo_combined.json";

interface CargoData {
  Company?: Array<{ Website?: string }>;
}

const extractDomainFromUrl = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    let domain: string;

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const urlObj = new URL(trimmed);
      domain = urlObj.hostname.toLowerCase();
    } else if (trimmed.startsWith("www.")) {
      domain = trimmed.slice(4).split("/")[0].toLowerCase();
    } else {
      domain = trimmed.split("/")[0].toLowerCase();
    }

    // Remove www. prefix if present
    domain = domain.replace(/^www\./, "");

    // Validate domain format
    if (!domain || domain.includes(" ") || domain.includes('"')) {
      return null;
    }

    // Must contain at least one dot and be valid domain-like
    if (
      !domain.includes(".") ||
      domain.startsWith("http") ||
      domain.startsWith("[")
    ) {
      return null;
    }

    return domain;
  } catch {
    return null;
  }
};

const generateMatchPatterns = (domains: string[]): string[] => {
  const patterns = new Set<string>();

  for (const domain of domains) {
    // Add both http and https patterns
    patterns.add(`*://${domain}/*`);
    // Also add www subdomain explicitly
    patterns.add(`*://www.${domain}/*`);
  }

  return Array.from(patterns).sort();
};

const fetchDataset = async (): Promise<CargoData> => {
  console.log("Fetching dataset...");
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }
  return response.json() as Promise<CargoData>;
};

const extractDomains = (data: CargoData): string[] => {
  const domains = new Set<string>();

  // Extract domains from Company entries
  for (const company of data.Company || []) {
    const website = company.Website;
    if (website) {
      const domain = extractDomainFromUrl(website);
      if (domain) {
        domains.add(domain);
      }
    }
  }

  return Array.from(domains).sort();
};

const updateManifest = (manifestPath: string, patterns: string[]): void => {
  console.log(`Updating ${path.basename(manifestPath)}...`);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  // Update host_permissions
  manifest.host_permissions = patterns;

  // Update content_scripts matches
  if (manifest.content_scripts && manifest.content_scripts[0]) {
    manifest.content_scripts[0].matches = patterns;
  }

  // Update web_accessible_resources matches
  if (
    manifest.web_accessible_resources &&
    manifest.web_accessible_resources[0]
  ) {
    manifest.web_accessible_resources[0].matches = patterns;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  Updated with ${patterns.length} patterns`);
};

const main = async (): Promise<void> => {
  try {
    const data = await fetchDataset();
    const domains = extractDomains(data);

    console.log(`\nExtracted ${domains.length} unique domains from dataset`);
    console.log("\nSample domains:");
    domains.slice(0, 10).forEach((d) => console.log(`  - ${d}`));

    const patterns = generateMatchPatterns(domains);
    console.log(`\nGenerated ${patterns.length} match patterns`);

    // Update manifests
    const chromeManifestPath = path.join(
      process.cwd(),
      "manifest",
      "chrome.json",
    );
    const firefoxManifestPath = path.join(
      process.cwd(),
      "manifest",
      "firefox.json",
    );

    updateManifest(chromeManifestPath, patterns);
    updateManifest(firefoxManifestPath, patterns);

    console.log("\n✅ Manifest files updated successfully!");
    console.log(
      "\nNote: The extension will now only run on the domains listed in the wiki.",
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main();

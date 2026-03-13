## Matching Configuration (`src/lib/matching/matchingConfig.ts`)

The URL matcher behavior is controlled by the exported `matchingConfig` object in `src/lib/matching/matchingConfig.ts`. You can override values at runtime with `setMatchingConfig(...)` and restore defaults with `resetMatchingConfig()`.

### Top-level params

- `enableSubdomainMatching` (`boolean`, default: `true`): allows matches when the visited URL and candidate URL share the same root domain but use different subdomains (for example `support.example.com` vs `example.com`). Produces a `subdomain` match.
- `enableMatchAcrossTLDs` (`boolean`, default: `true`): allows cross-TLD alias matches for the same domain label when there is international suffix evidence (for example a compound suffix like `dyson.co.uk` vs `dyson.com.au`, or a ccTLD like `ford.ca` vs `ford.com`). Produces a `subdomain` match with a `cross_tld_alias` reason.
- `enableEcommerceFamilyAliasMatching` (`boolean`, default: `true`): allows known ecommerce domains in the same configured family (Amazon, eBay, etc.) to match each other across country domains. Produces a `subdomain` match with an `ecommerce_family_alias` reason.
- `crossTldCountryCodeSuffixes` (`string[]`, default: generated ccTLD list): explicit suffix data used by `enableMatchAcrossTLDs` to decide whether a public suffix has country-code evidence. The matcher checks the last label of the public suffix against this list (for example `ca` in `ford.ca`, `au` in `example.com.au`, `uk` in `example.co.uk`). The default list is generated into [generatedCountryCodeSuffixes.ts](/Users/jdumay/code/CRW-Extension/src/generated/matching/generatedCountryCodeSuffixes.ts) by [update-country-code-suffixes.ts](/Users/jdumay/code/CRW-Extension/scripts/update-country-code-suffixes.ts) from `i18n-iso-countries`, with explicit ccTLD exceptions.
- `crossTldCompoundSuffixPrefixes` (`string[]`, default: generated generic registry prefixes): explicit allowlist for compound public-suffix prefixes that can participate in cross-TLD aliasing before a country code. This is what allows `co.uk` or `com.au`, while blocking sector or brand namespaces like `bank.in`. The default list is generated into [generatedCompoundSuffixPrefixes.ts](/Users/jdumay/code/CRW-Extension/src/generated/matching/generatedCompoundSuffixPrefixes.ts) from the [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat), then filtered through a small local generic-prefix policy.
- `restrictMetaPageContextToEcommerceHosts` (`boolean`, default: `true`): when enabled, title/meta/OG page-context seeds are only used on known ecommerce hosts. Set to `false` to allow those signals on non-ecommerce hosts when URL seeds exist.
- `urlSeedLimit` (`number`, default: `3`): default limit intended for URL-seed matching workflows.
- `metaSeedLimit` (`number`, default: `5`): default limit intended for metadata-seed matching workflows.
- `pageContextMinEntityNameLength` (`number`, default: `3`): minimum entity-name length intended for page-context matching/scoring workflows.
- `marketplaceBrandDenylist` (`string[]`, default: `["amazon", "ebay"]`): brand names intended to be excluded from page-context brand extraction/scoring.
- `amazonPropertyMatching` (`{ enabled, useBrand, useManufacturer, brandWeight, manufacturerWeight }`): controls whether Amazon product-property signals (`Brand` / `Manufacturer`) are used in page-context scoring and with what weights.
- `ebayJsonLdProductMatching` (`{ enabled, useBrand, useManufacturer, brandWeight, manufacturerWeight }`): controls whether eBay `schema.org` Product JSON-LD signals (`brand` / `manufacturer`) are used in page-context scoring and with what weights.
- `enableSearchResultsPageSuppressions` (`boolean`, default: `true`): globally enables/disables suppression of matches on configured search-result pages (for example Google/Bing/Yahoo/DuckDuckGo search pages).
- `specificPathDomainMatches` (`string[]`, default: `["github.com"]`): hostnames for which the matcher keeps only the most specific exact/partial path match per host (for example deeper GitHub repo/org paths win over broader `github.com/` matches).
- `ecommerceDomainFamilyMap` (`Record<string, string>`): maps known ecommerce domains to a family alias used by `enableEcommerceFamilyAliasMatching` (for example many `amazon.*` domains map to `"amazon"`, many `ebay.*` domains map to `"ebay"`).

### Nested params

- `urlMatchPriority.exact` (`number`, default: `3`): relative priority for exact host + path matches.
- `urlMatchPriority.partial` (`number`, default: `2`): relative priority for exact host + path-prefix matches.
- `urlMatchPriority.subdomain` (`number`, default: `1`): relative priority for subdomain/cross-TLD/ecommerce-family matches.
- `pageContextWeights.title` (`number`, default: `10`): weight for page `<title>` text in page-context scoring.
- `pageContextWeights.metaTitle` (`number`, default: `9`): weight for metadata title fields in page-context scoring.
- `pageContextWeights.description` (`number`, default: `6`): weight for page/meta description text in page-context scoring.
- `pageContextWeights.ogTitle` (`number`, default: `9`): weight for Open Graph title text in page-context scoring.
- `pageContextWeights.ogDescription` (`number`, default: `6`): weight for Open Graph description text in page-context scoring.
- `pageContextTypeBoosts.company` (`number`, default: `3`): score boost for entities typed as companies in page-context scoring.
- `pageContextTypeBoosts.productLine` (`number`, default: `4`): score boost for entities typed as product lines in page-context scoring.
- `pageContextTypeBoosts.product` (`number`, default: `4`): score boost for entities typed as products in page-context scoring.
- `amazonPropertyMatching.enabled` (`boolean`, default: `true`): enables Amazon product-property matching signals.
- `amazonPropertyMatching.useBrand` (`boolean`, default: `true`): includes the extracted Amazon `Brand` property in page-context scoring.
- `amazonPropertyMatching.useManufacturer` (`boolean`, default: `true`): includes the extracted Amazon `Manufacturer` property in page-context scoring.
- `amazonPropertyMatching.brandWeight` (`number`, default: `16`): score weight multiplier for Amazon `Brand` property hits.
- `amazonPropertyMatching.manufacturerWeight` (`number`, default: `12`): score weight multiplier for Amazon `Manufacturer` property hits.
- `ebayJsonLdProductMatching.enabled` (`boolean`, default: `true`): enables eBay Product JSON-LD matching signals.
- `ebayJsonLdProductMatching.useBrand` (`boolean`, default: `true`): includes the extracted eBay Product JSON-LD `brand` value in page-context scoring.
- `ebayJsonLdProductMatching.useManufacturer` (`boolean`, default: `true`): includes the extracted eBay Product JSON-LD `manufacturer` value in page-context scoring.
- `ebayJsonLdProductMatching.brandWeight` (`number`, default: `14`): score weight multiplier for eBay Product JSON-LD `brand` hits.
- `ebayJsonLdProductMatching.manufacturerWeight` (`number`, default: `10`): score weight multiplier for eBay Product JSON-LD `manufacturer` hits.
- `companyAliasSuffixStripping.enabled` (`boolean`, default: `true`): enables alias generation for company names by stripping common legal suffixes / trailing corporate words (for example `Brother Industries Ltd.` can produce `Brother` for page-context matching).
- `companyAliasSuffixStripping.legalSuffixTokens` (`string[]`): legal suffix tokens that may be removed from the end of a company name when alias generation is enabled (for example `ltd`, `inc`, `llc`).
- `companyAliasSuffixStripping.genericTrailingTokens` (`string[]`): generic trailing company words that may be removed after legal suffix stripping (for example `industries`, `group`, `holdings`).
- `searchResultsPageSuppressions` (`Array<{ hostSuffixes: string[]; paths: string[]; requiredQueryParams?: string[] }>`): list of search-result page URL rules that should return no matches. `requiredQueryParams` lets root-path search engines (for example DuckDuckGo `/?q=...`) be targeted without suppressing the homepage.

### Current usage notes

- URL matching currently uses `enableSubdomainMatching`, `enableMatchAcrossTLDs`, `enableEcommerceFamilyAliasMatching`, `crossTldCountryCodeSuffixes`, `crossTldCompoundSuffixPrefixes`, `specificPathDomainMatches`, and `ecommerceDomainFamilyMap`.
- `matchByPageContext(...)` currently reads `enableSearchResultsPageSuppressions`, `searchResultsPageSuppressions`, `restrictMetaPageContextToEcommerceHosts`, `companyAliasSuffixStripping`, `amazonPropertyMatching`, and `ebayJsonLdProductMatching` (along with related page-context matching logic).
- The page-context and seed-limit params are defined in config now for matching/scoring workflows, but are not currently read by `src/lib/matching/urlMatching.ts`.

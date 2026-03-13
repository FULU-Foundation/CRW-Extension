export type SearchResultsPageSuppressionRule = {
  hostSuffixes: string[];
  paths: string[];
  requiredQueryParams?: string[];
};

export type CompanyAliasSuffixStrippingConfig = {
  enabled: boolean;
  legalSuffixTokens: string[];
  genericTrailingTokens: string[];
};

export type AmazonPropertyMatchingConfig = {
  enabled: boolean;
  useBrand: boolean;
  useManufacturer: boolean;
  brandWeight: number;
  manufacturerWeight: number;
};

export type EbayJsonLdProductMatchingConfig = {
  enabled: boolean;
  useBrand: boolean;
  useManufacturer: boolean;
  brandWeight: number;
  manufacturerWeight: number;
};

export type MatchingConfig = {
  enableSubdomainMatching: boolean;
  enableMatchAcrossTLDs: boolean;
  crossTldAliasGlobalSuffixes: string[];
  crossTldAliasMarketSecondLevelLabels: string[];
  enableEcommerceFamilyAliasMatching: boolean;
  restrictMetaPageContextToEcommerceHosts: boolean;
  urlSeedLimit: number;
  metaSeedLimit: number;
  urlMatchPriority: {
    exact: number;
    partial: number;
    subdomain: number;
  };
  pageContextWeights: {
    title: number;
    metaTitle: number;
    description: number;
    ogTitle: number;
    ogDescription: number;
  };
  pageContextTypeBoosts: {
    company: number;
    productLine: number;
    product: number;
  };
  pageContextMinEntityNameLength: number;
  marketplaceBrandDenylist: string[];
  amazonPropertyMatching: AmazonPropertyMatchingConfig;
  ebayJsonLdProductMatching: EbayJsonLdProductMatchingConfig;
  companyAliasSuffixStripping: CompanyAliasSuffixStrippingConfig;
  enableSearchResultsPageSuppressions: boolean;
  searchResultsPageSuppressions: SearchResultsPageSuppressionRule[];
  ecommerceDomainFamilyMap: Record<string, string>;
  specificPathDomainMatches: string[];
};

const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  enableSubdomainMatching: true,
  enableMatchAcrossTLDs: true,
  crossTldAliasGlobalSuffixes: ["com", "net", "org"],
  crossTldAliasMarketSecondLevelLabels: [
    "ac",
    "co",
    "com",
    "edu",
    "net",
    "org",
  ],
  enableEcommerceFamilyAliasMatching: true,
  restrictMetaPageContextToEcommerceHosts: true,
  urlSeedLimit: 3,
  metaSeedLimit: 5,
  urlMatchPriority: {
    exact: 3,
    partial: 2,
    subdomain: 1,
  },
  pageContextWeights: {
    title: 10,
    metaTitle: 9,
    description: 6,
    ogTitle: 9,
    ogDescription: 6,
  },
  pageContextTypeBoosts: {
    company: 3,
    productLine: 4,
    product: 4,
  },
  pageContextMinEntityNameLength: 3,
  marketplaceBrandDenylist: ["amazon", "ebay"],
  amazonPropertyMatching: {
    enabled: true,
    useBrand: true,
    useManufacturer: true,
    brandWeight: 16,
    manufacturerWeight: 12,
  },
  ebayJsonLdProductMatching: {
    enabled: true,
    useBrand: true,
    useManufacturer: true,
    brandWeight: 14,
    manufacturerWeight: 10,
  },
  companyAliasSuffixStripping: {
    enabled: true,
    legalSuffixTokens: [
      "inc",
      "incorporated",
      "corp",
      "corporation",
      "co",
      "company",
      "ltd",
      "limited",
      "llc",
      "plc",
      "lp",
      "llp",
      "gmbh",
      "ag",
      "sa",
      "nv",
      "bv",
      "oy",
      "oyj",
      "pte",
      "pty",
    ],
    genericTrailingTokens: [
      "group",
      "holdings",
      "industries",
      "industry",
      "systems",
      "technology",
      "technologies",
    ],
  },
  enableSearchResultsPageSuppressions: true,
  searchResultsPageSuppressions: [
    {
      hostSuffixes: ["google.com"],
      paths: ["/search"],
      requiredQueryParams: ["q"],
    },
    {
      hostSuffixes: ["bing.com"],
      paths: ["/search"],
      requiredQueryParams: ["q"],
    },
    {
      hostSuffixes: ["search.yahoo.com"],
      paths: ["/search"],
      requiredQueryParams: ["p"],
    },
    {
      hostSuffixes: ["duckduckgo.com"],
      paths: ["/"],
      requiredQueryParams: ["q"],
    },
  ],
  specificPathDomainMatches: ["github.com"],
  ecommerceDomainFamilyMap: {
    "amazon.com": "amazon",
    "amazon.ca": "amazon",
    "amazon.com.mx": "amazon",
    "amazon.com.br": "amazon",
    "amazon.co.uk": "amazon",
    "amazon.de": "amazon",
    "amazon.fr": "amazon",
    "amazon.it": "amazon",
    "amazon.es": "amazon",
    "amazon.nl": "amazon",
    "amazon.se": "amazon",
    "amazon.pl": "amazon",
    "amazon.com.be": "amazon",
    "amazon.com.tr": "amazon",
    "amazon.eg": "amazon",
    "amazon.sa": "amazon",
    "amazon.ae": "amazon",
    "amazon.in": "amazon",
    "amazon.sg": "amazon",
    "amazon.com.au": "amazon",
    "amazon.co.jp": "amazon",
    "ebay.com": "ebay",
    "ebay.ca": "ebay",
    "ebay.com.mx": "ebay",
    "ebay.com.br": "ebay",
    "ebay.co.uk": "ebay",
    "ebay.de": "ebay",
    "ebay.fr": "ebay",
    "ebay.it": "ebay",
    "ebay.es": "ebay",
    "ebay.nl": "ebay",
    "ebay.be": "ebay",
    "ebay.pl": "ebay",
    "ebay.ie": "ebay",
    "ebay.at": "ebay",
    "ebay.ch": "ebay",
    "ebay.com.au": "ebay",
    "ebay.com.hk": "ebay",
    "ebay.ph": "ebay",
    "ebay.my": "ebay",
    "ebay.sg": "ebay",
  },
};

export const matchingConfig: MatchingConfig = {
  ...DEFAULT_MATCHING_CONFIG,
};

export const setMatchingConfig = (overrides: Partial<MatchingConfig>): void => {
  Object.assign(matchingConfig, overrides);
};

export const resetMatchingConfig = (): void => {
  Object.assign(matchingConfig, DEFAULT_MATCHING_CONFIG);
};

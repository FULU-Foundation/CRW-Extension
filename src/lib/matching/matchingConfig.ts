export type MatchingConfig = {
  enableSubdomainMatching: boolean;
  enableEcommerceFamilyAliasMatching: boolean;
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
  ecommerceDomainFamilyMap: Record<string, string>;
};

const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  enableSubdomainMatching: false,
  enableEcommerceFamilyAliasMatching: true,
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

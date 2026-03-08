import matchingConfigData from "./matchingConfig.json" with { type: "json" };

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

export type SchemaJsonLdProductMatchingConfig = {
  enabled: boolean;
  useName: boolean;
  useBrand: boolean;
  useManufacturer: boolean;
  nameWeight: number;
  brandWeight: number;
  manufacturerWeight: number;
};

export type MatchingConfig = {
  enableSubdomainMatching: boolean;
  enableMatchAcrossTLDs: boolean;
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
  schemaJsonLdProductMatching: SchemaJsonLdProductMatchingConfig;
  companyAliasSuffixStripping: CompanyAliasSuffixStrippingConfig;
  enableSearchResultsPageSuppressions: boolean;
  searchResultsPageSuppressions: SearchResultsPageSuppressionRule[];
  ecommerceDomainFamilyMap: Record<string, string>;
  specificPathDomainMatches: string[];
};

const deepClone = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T;
};

const DEFAULT_MATCHING_CONFIG: MatchingConfig = deepClone(
  matchingConfigData as MatchingConfig,
);

export const matchingConfig: MatchingConfig = deepClone(
  DEFAULT_MATCHING_CONFIG,
);

export const setMatchingConfig = (overrides: Partial<MatchingConfig>): void => {
  Object.assign(matchingConfig, overrides);
};

export const resetMatchingConfig = (): void => {
  Object.assign(matchingConfig, deepClone(DEFAULT_MATCHING_CONFIG));
};

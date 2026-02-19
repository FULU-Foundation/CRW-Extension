const normalizeHost = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

const isDomainOrSubdomain = (hostname: string, domain: string): boolean => {
  const host = normalizeHost(hostname);
  const target = normalizeHost(domain);
  return host === target || host.endsWith(`.${target}`);
};

export const ECOMMERCE_DOMAIN_FAMILY_MAP = {
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
} as const;

export const ECOMMERCE_DOMAINS = Object.keys(ECOMMERCE_DOMAIN_FAMILY_MAP);

export const getEcommerceFamily = (hostname: string): string | null => {
  const host = normalizeHost(hostname);
  const matchedDomain = ECOMMERCE_DOMAINS.find((domain) =>
    isDomainOrSubdomain(host, domain),
  );
  if (!matchedDomain) return null;
  return ECOMMERCE_DOMAIN_FAMILY_MAP[
    matchedDomain as keyof typeof ECOMMERCE_DOMAIN_FAMILY_MAP
  ];
};

export const isKnownEcommerceHost = (hostname: string): boolean => {
  return getEcommerceFamily(hostname) !== null;
};

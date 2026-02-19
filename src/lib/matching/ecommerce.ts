const normalizeHost = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

const isDomainOrSubdomain = (hostname: string, domain: string): boolean => {
  const host = normalizeHost(hostname);
  const target = normalizeHost(domain);
  return host === target || host.endsWith(`.${target}`);
};

export const ECOMMERCE_DOMAINS = [
  "amazon.com",
  "amazon.ca",
  "amazon.com.mx",
  "amazon.com.br",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
  "amazon.nl",
  "amazon.se",
  "amazon.pl",
  "amazon.com.be",
  "amazon.com.tr",
  "amazon.eg",
  "amazon.sa",
  "amazon.ae",
  "amazon.in",
  "amazon.sg",
  "amazon.com.au",
  "amazon.co.jp",
  "ebay.com",
  "ebay.ca",
  "ebay.com.mx",
  "ebay.com.br",
  "ebay.co.uk",
  "ebay.de",
  "ebay.fr",
  "ebay.it",
  "ebay.es",
  "ebay.nl",
  "ebay.be",
  "ebay.pl",
  "ebay.ie",
  "ebay.at",
  "ebay.ch",
  "ebay.com.au",
  "ebay.com.hk",
  "ebay.ph",
  "ebay.my",
  "ebay.sg",
] as const;

export const isKnownEcommerceHost = (hostname: string): boolean => {
  return ECOMMERCE_DOMAINS.some((domain) =>
    isDomainOrSubdomain(hostname, domain),
  );
};

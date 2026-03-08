export type CustomExtractorProperties = {
  productName?: string;
  brandName?: string;
  manufacturerName?: string;
};

export type CustomMarketplaceExtractor = (
  doc: Document,
  hostname: string,
) => CustomExtractorProperties | undefined;

/** Exact C0-reviewed removable mesh only. Structural tubes, bosses and guards survive. */
export const reviewedCrownPreviewCases = new Set([
  'case-feiyashi-samurai-438', 'case-namoki-nmk920-tuna-47', 'case-nh05-ladies-dress-34',
  'case-tandorio-bronze-diver-44', 'case-tandorio-nh05-research-34', 'case-tandorio-pilot-40',
  'case-tandorio-willard-41', 'case-wr-skx-sandblasted-42',
]);
export const hideEmbeddedCrownPreview = (assetId: string, nodeName: string): boolean => reviewedCrownPreviewCases.has(assetId) && nodeName === 'DD_CASE_CROWN_PREVIEW';

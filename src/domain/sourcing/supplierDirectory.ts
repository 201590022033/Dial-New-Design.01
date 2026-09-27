export type SupplierComponentCategory = 'case' | 'dial' | 'crystal' | 'chapter-ring' | 'bezel' | 'hands' | 'strap' | 'movement';

export interface SupplierProfile {
  id: string;
  name: string;
  channel: 'marketplace' | 'specialist-direct';
  storefrontUrl: string;
  coverage: SupplierComponentCategory[];
  pricePosition: 'budget' | 'mid-market' | 'premium';
  onboardingStatus: 'candidate' | 'trial' | 'approved';
  cataloguePolicy: 'capture-on-demand';
  notes: string;
}

/** A deliberately small directory: offers are captured on demand. */
export const supplierDirectory: SupplierProfile[] = [
  {
    id: 'supplier-aliexpress-marketplace', name: 'AliExpress marketplace', channel: 'marketplace',
    storefrontUrl: 'https://www.aliexpress.com/',
    coverage: ['case', 'dial', 'crystal', 'chapter-ring', 'bezel', 'hands', 'strap', 'movement'],
    pricePosition: 'budget', onboardingStatus: 'trial', cataloguePolicy: 'capture-on-demand',
    notes: 'Capture exact seller, variant, item price and South-African shipping at checkout; do not trust teaser prices.'
  },
  {
    id: 'supplier-namoki', name: 'NamokiMODS', channel: 'specialist-direct',
    storefrontUrl: 'https://www.namokimods.com/',
    coverage: ['case', 'dial', 'crystal', 'chapter-ring', 'bezel', 'hands', 'strap'],
    pricePosition: 'premium', onboardingStatus: 'candidate', cataloguePolicy: 'capture-on-demand',
    notes: 'Useful compatibility baseline and fallback source; landed price must still be checked.'
  },
  {
    id: 'supplier-dlw', name: 'DLW Watches', channel: 'specialist-direct',
    storefrontUrl: 'https://www.dlwwatches.com/',
    coverage: ['case', 'dial', 'crystal', 'chapter-ring', 'bezel', 'hands', 'strap'],
    pricePosition: 'mid-market', onboardingStatus: 'candidate', cataloguePolicy: 'capture-on-demand',
    notes: 'Candidate for style breadth without mirroring the full storefront.'
  },
  {
    id: 'supplier-crystaltimes', name: 'Crystaltimes / SeikoMods', channel: 'specialist-direct',
    storefrontUrl: 'https://usa.crystaltimes.net/',
    coverage: ['case', 'crystal', 'chapter-ring', 'bezel', 'hands'],
    pricePosition: 'mid-market', onboardingStatus: 'candidate', cataloguePolicy: 'capture-on-demand',
    notes: 'Candidate for reference-quality dimensions and sapphire options.'
  },
  {
    id: 'supplier-lucius', name: 'Lucius Atelier', channel: 'specialist-direct',
    storefrontUrl: 'https://luciusatelier.com/',
    coverage: ['case', 'dial', 'chapter-ring', 'bezel', 'hands'],
    pricePosition: 'premium', onboardingStatus: 'candidate', cataloguePolicy: 'capture-on-demand',
    notes: 'Candidate for distinctive designs; add only representative or user-selected offers.'
  }
];

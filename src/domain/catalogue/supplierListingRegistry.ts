import type { SupplierListing } from './types';

const DEMO_PROVENANCE = {
  dataSource: 'synthetic-demonstration-seed',
  sourceType: 'demo-fixture' as const,
  isDemonstrationFixture: true,
  retrievedAtIso: null
};

/**
 * defaultSupplierListings
 * Synthetic demonstration fixtures for catalogue components.
 * These records are strictly demonstration/example fixtures and MUST NOT be
 * treated as verified production supplier truth or live vendor quotes.
 */
export const defaultSupplierListings: SupplierListing[] = [
  // Dial blank listings
  {
    id: 'supp-dial-blank-namoki',
    catalogueItemId: 'cat-dial-blank',
    supplierName: 'NamokiMODS',
    sku: 'NK-DL-BLK-01',
    productUrl: 'https://namokimods.com/products/dial-blank-28-5mm',
    unitPrice: 24.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 3,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: High precision brass blank with NH35 feet soldered'
  },
  {
    id: 'supp-dial-blank-aliexpress',
    catalogueItemId: 'cat-dial-blank',
    supplierName: 'AliExpress - WatchModStore',
    sku: 'AX-DL-285-BR',
    productUrl: 'https://aliexpress.com/item/100500123456.html',
    unitPrice: 8.5,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 14,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Budget brass blank'
  },

  // Hour & Minute Hand listings
  {
    id: 'supp-hands-pilot-lucius',
    catalogueItemId: 'cat-hour-hand',
    supplierName: 'Lucius Atelier',
    sku: 'LA-HND-PLT-HR',
    productUrl: 'https://luciusatelier.com/products/pilot-hands',
    unitPrice: 18.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 4,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: BGW9 lumed hour hand, 1.50mm hole'
  },
  {
    id: 'supp-hands-pilot-lucius-min',
    catalogueItemId: 'cat-minute-hand',
    supplierName: 'Lucius Atelier',
    sku: 'LA-HND-PLT-MN',
    productUrl: 'https://luciusatelier.com/products/pilot-hands',
    unitPrice: 18.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 4,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: BGW9 lumed minute hand, 0.89mm hole'
  },
  {
    id: 'supp-hands-seikomods-hr',
    catalogueItemId: 'cat-hour-hand',
    supplierName: 'SeikoMods / Crystaltimes',
    sku: 'CT-HND-01-HR',
    productUrl: 'https://seikomods.com/products/hands-set-classic',
    unitPrice: 14.5,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 5,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Polished steel hour hand for 7S26/NH35'
  },
  {
    id: 'supp-hands-aliexpress-hr',
    catalogueItemId: 'cat-hour-hand',
    supplierName: 'AliExpress - Miuksi Store',
    sku: 'MK-HND-HR-00',
    productUrl: null,
    unitPrice: 6.0,
    currency: 'USD',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 12,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Generic NH35 hour hand'
  },

  // Chapter Ring listings
  {
    id: 'supp-chring-namoki',
    catalogueItemId: 'cat-chapter-ring',
    supplierName: 'NamokiMODS',
    sku: 'NK-CR-SKX-ST',
    productUrl: 'https://namokimods.com/products/skx007-chapter-ring-brushed',
    unitPrice: 19.5,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 3,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Brushed steel chapter ring'
  },
  {
    id: 'supp-chring-aliexpress',
    catalogueItemId: 'cat-chapter-ring',
    supplierName: 'AliExpress - Tandorio Store',
    sku: 'TD-CR-305',
    productUrl: null,
    unitPrice: 7.0,
    currency: 'USD',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 16,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Standard SKX chapter ring'
  },

  // Rotating Bezel listings
  {
    id: 'supp-bezel-dlw',
    catalogueItemId: 'cat-rotating-bezel',
    supplierName: 'DLW Watches',
    sku: 'DLW-BZ-COIN',
    productUrl: 'https://dlwwatches.com/products/bezel-skx007-coin-edge',
    unitPrice: 38.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 5,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Coin edge 316L stainless steel rotating bezel'
  },
  {
    id: 'supp-bezel-namoki',
    catalogueItemId: 'cat-rotating-bezel',
    supplierName: 'NamokiMODS',
    sku: 'NK-BZ-SKX-KN',
    productUrl: 'https://namokimods.com/products/skx-knurled-bezel',
    unitPrice: 35.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 3,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Knurled sub-style rotating bezel'
  },

  // Crystal listings
  {
    id: 'supp-crystal-crystaltimes-dd',
    catalogueItemId: 'cat-double-domed-sapphire',
    supplierName: 'Crystaltimes',
    sku: 'CT037-BLUE-AR',
    productUrl: 'https://usa.crystaltimes.net/shop/models/skx007-mod-parts/ct037/',
    unitPrice: 42.0,
    currency: 'USD',
    stockStatus: 'in-stock',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 2,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: Double domed sapphire crystal'
  },
  {
    id: 'supp-crystal-aliexpress-dd',
    catalogueItemId: 'cat-double-domed-sapphire',
    supplierName: 'AliExpress - WatchGlass Hub',
    sku: 'AX-SAP-315-DD',
    productUrl: null,
    unitPrice: 16.0,
    currency: 'USD',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: 15,
    lastCheckedIso: null,
    provenance: DEMO_PROVENANCE,
    notes: 'Demonstration fixture: 31.5mm double domed sapphire'
  }
];

export const getSupplierListing = (id: string): SupplierListing | undefined => {
  return defaultSupplierListings.find((listing) => listing.id === id);
};

export const getListingsForCatalogueItem = (catalogueItemId: string): SupplierListing[] => {
  return defaultSupplierListings.filter((listing) => listing.catalogueItemId === catalogueItemId);
};

/**
 * Determines whether a listing represents verified production commercial truth.
 * Demonstration fixtures and unverified records are excluded.
 */
export const isVerifiedProductionListing = (listing: SupplierListing): boolean => {
  return (
    listing.verificationStatus === 'verified' &&
    !listing.provenance.isDemonstrationFixture &&
    listing.status === 'active'
  );
};

/**
 * Returns only verified production listings, filtering out synthetic demonstration seeds.
 */
export const filterProductionListings = (listings: SupplierListing[]): SupplierListing[] => {
  return listings.filter(isVerifiedProductionListing);
};

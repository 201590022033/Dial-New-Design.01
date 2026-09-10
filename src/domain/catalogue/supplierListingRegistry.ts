import type { SupplierListing } from './types';

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
    inStock: true,
    leadTimeDays: 3,
    verifiedByStaff: true,
    notes: 'High precision brass blank with NH35 feet soldered'
  },
  {
    id: 'supp-dial-blank-aliexpress',
    catalogueItemId: 'cat-dial-blank',
    supplierName: 'AliExpress - WatchModStore',
    sku: 'AX-DL-285-BR',
    productUrl: 'https://aliexpress.com/item/100500123456.html',
    unitPrice: 8.5,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 14,
    verifiedByStaff: false,
    notes: 'Budget brass blank, dial feet require inspection'
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
    inStock: true,
    leadTimeDays: 4,
    verifiedByStaff: true,
    notes: 'BGW9 lumed hour hand, 1.50mm hole'
  },
  {
    id: 'supp-hands-pilot-lucius-min',
    catalogueItemId: 'cat-minute-hand',
    supplierName: 'Lucius Atelier',
    sku: 'LA-HND-PLT-MN',
    productUrl: 'https://luciusatelier.com/products/pilot-hands',
    unitPrice: 18.0,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 4,
    verifiedByStaff: true,
    notes: 'BGW9 lumed minute hand, 0.89mm hole'
  },
  {
    id: 'supp-hands-seikomods-hr',
    catalogueItemId: 'cat-hour-hand',
    supplierName: 'SeikoMods / Crystaltimes',
    sku: 'CT-HND-01-HR',
    productUrl: 'https://seikomods.com/products/hands-set-classic',
    unitPrice: 14.5,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 5,
    verifiedByStaff: true,
    notes: 'Polished steel hour hand for 7S26/NH35'
  },
  {
    id: 'supp-hands-aliexpress-hr',
    catalogueItemId: 'cat-hour-hand',
    supplierName: 'AliExpress - Miuksi Store',
    sku: 'MK-HND-HR-00',
    unitPrice: 6.0,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 12,
    verifiedByStaff: false,
    notes: 'Generic NH35 hour hand'
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
    inStock: true,
    leadTimeDays: 3,
    verifiedByStaff: true,
    notes: 'Brushed steel chapter ring with engraved minute markers'
  },
  {
    id: 'supp-chring-aliexpress',
    catalogueItemId: 'cat-chapter-ring',
    supplierName: 'AliExpress - Tandorio Store',
    sku: 'TD-CR-305',
    unitPrice: 7.0,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 16,
    verifiedByStaff: false,
    notes: 'Standard SKX-compatible chapter ring'
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
    inStock: true,
    leadTimeDays: 5,
    verifiedByStaff: true,
    notes: 'Coin edge 316L stainless steel rotating bezel'
  },
  {
    id: 'supp-bezel-namoki',
    catalogueItemId: 'cat-rotating-bezel',
    supplierName: 'NamokiMODS',
    sku: 'NK-BZ-SKX-KN',
    productUrl: 'https://namokimods.com/products/skx-knurled-bezel',
    unitPrice: 35.0,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 3,
    verifiedByStaff: true,
    notes: 'Knurled sub-style rotating bezel'
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
    inStock: true,
    leadTimeDays: 2,
    verifiedByStaff: true,
    notes: 'Double domed sapphire crystal with blue underside anti-reflective coating'
  },
  {
    id: 'supp-crystal-aliexpress-dd',
    catalogueItemId: 'cat-double-domed-sapphire',
    supplierName: 'AliExpress - WatchGlass Hub',
    sku: 'AX-SAP-315-DD',
    unitPrice: 16.0,
    currency: 'USD',
    inStock: true,
    leadTimeDays: 15,
    verifiedByStaff: false,
    notes: '31.5mm double domed sapphire'
  }
];

export const getSupplierListing = (id: string): SupplierListing | undefined => {
  return defaultSupplierListings.find((listing) => listing.id === id);
};

export const getListingsForCatalogueItem = (catalogueItemId: string): SupplierListing[] => {
  return defaultSupplierListings.filter((listing) => listing.catalogueItemId === catalogueItemId);
};

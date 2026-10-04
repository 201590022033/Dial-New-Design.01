import type { SupplierListing } from './types';
import { nh05SupplierCandidateListings } from './nh05SupplierCandidates';

const RESEARCH_CAPTURED_AT = '2026-09-26T09:30:00+02:00';
const LARGE_CASE_RESEARCH_AT = '2026-09-27T17:57:05+02:00';

const documentedCaseListing = (input: {
  id: string;
  catalogueItemId: string;
  supplierName: string;
  sku: string;
  productUrl: string;
  unitPrice: number;
  currency: string;
  stockStatus: SupplierListing['stockStatus'];
  drawingUrl: string;
  shippingPrice?: number | null;
  shippingCurrency?: string | null;
  shippingDestination?: string;
  notes: string;
}): SupplierListing => ({
  id: input.id,
  catalogueItemId: input.catalogueItemId,
  supplierName: input.supplierName,
  sku: input.sku,
  productUrl: input.productUrl,
  unitPrice: input.unitPrice,
  currency: input.currency,
  shippingPrice: input.shippingPrice ?? null,
  shippingCurrency: input.shippingCurrency ?? input.currency,
  shippingDestination: input.shippingDestination ?? 'South Africa',
  stockStatus: input.stockStatus,
  status: 'active',
  verificationStatus: 'verified',
  leadTimeDays: null,
  lastCheckedIso: '2026-09-27T16:30:00Z',
  provenance: {
    dataSource: input.productUrl,
    sourceType: 'web-scrape',
    isDemonstrationFixture: false,
    retrievedAtIso: LARGE_CASE_RESEARCH_AT
  },
  engineeringEvidence: {
    level: 'dimensioned-drawing',
    glbReadiness: 'visual-glb-ready',
    checkedAtIso: LARGE_CASE_RESEARCH_AT,
    drawingUrl: input.drawingUrl,
    notes: 'The dimension drawing belongs to this exact product/listing. It is sufficient for a drawing-constrained presentation GLB, but not a manufacturing CAD claim unless all hidden interfaces and tolerances are supplied.'
  },
  notes: input.notes
});

/**
 * Timestamped marketplace snapshots. These are item-price observations, not
 * verified landed quotes: variant, availability and South-African shipping
 * must be confirmed in the buyer's AliExpress checkout session.
 */
export const researchedSupplierListings: SupplierListing[] = [
  ...nh05SupplierCandidateListings,
  documentedCaseListing({
    id: 'research-tandorio-pilot-case-40', catalogueItemId: 'cat-case-tandorio-pilot-40', supplierName: 'Tandorio Watches', sku: 'TANDORIO-PILOT-40',
    productUrl: 'https://tandoriowatch.com/products/40mm-pilot-watch-case-brushed-design-316l-stainless-steel', unitPrice: 44.58, currency: 'USD', stockStatus: 'in-stock',
    drawingUrl: 'https://ae01.alicdn.com/kf/H8b156939f0b149c889aa7c5a7b4e63f5t.jpg',
    notes: 'Exact silvery NH-series case price. Seller drawing states 40.20 mm OD, 12.30 mm thickness and 20 mm lugs. Shipping to South Africa remains checkout-dependent.'
  }),
  documentedCaseListing({
    id: 'research-namoki-nmk920-tuna', catalogueItemId: 'cat-case-namoki-nmk920-tuna-47', supplierName: 'namokiMODS', sku: 'NMK920-BRUSHED',
    productUrl: 'https://www.namokimods.com/products/nmk920-tuna-skx007-srpd-watch-case-brushed-finish', unitPrice: 195, currency: 'SGD', stockStatus: 'out-of-stock',
    drawingUrl: 'https://cdn.shopify.com/s/files/1/0139/0434/7193/files/image_393d712f-eeae-4b1e-8028-3f021f774d1b_600x600.png?v=1625647458',
    notes: 'Exact NMK920 listing and its published dimension image. Sold out when checked; shipping is advertised as free/discounted express but must be confirmed for South Africa.'
  }),
  documentedCaseListing({
    id: 'research-ebay-feiyashi-samurai-188553207610', catalogueItemId: 'cat-case-feiyashi-samurai-438', supplierName: 'FEIYASHI / yulan01 on eBay', sku: 'EBAY-188553207610',
    productUrl: 'https://www.ebay.com/itm/188553207610', unitPrice: 56.99, currency: 'USD', stockStatus: 'in-stock', shippingPrice: 40, shippingCurrency: 'USD', shippingDestination: 'Worldwide listing; confirm South Africa',
    drawingUrl: 'https://i.ebayimg.com/images/g/HywAAOSwDK5l4J2D/s-l400.jpg',
    notes: 'Exact active Samurai case listing. The page showed US$40 worldwide shipping; destination-specific availability still requires checkout confirmation.'
  }),
  documentedCaseListing({
    id: 'research-ebay-tandorio-bronze-diver-295218015063', catalogueItemId: 'cat-case-tandorio-bronze-diver-44', supplierName: 'Tandorio Watch on eBay', sku: 'EBAY-295218015063',
    productUrl: 'https://www.ebay.com/itm/295218015063', unitPrice: 111.29, currency: 'USD', stockStatus: 'out-of-stock',
    drawingUrl: 'https://i.ebayimg.com/images/g/jw0AAOSwwOZjYdVj/s-l1600.png',
    notes: 'Exact 44 mm CuSn8 bronze diver case and drawing. Listing was out of stock when checked; retained as a GLB drawing source, not an order recommendation.'
  }),
  documentedCaseListing({
    id: 'research-wr-skx-sandblasted-42', catalogueItemId: 'cat-case-wr-skx-sandblasted-42', supplierName: 'WR Accessories', sku: 'WR-SKX-SRPD53-11',
    productUrl: 'https://wraccessories.com/products/skx-srpd53-case-set-for-seiko-mod-11', unitPrice: 99.90, currency: 'USD', stockStatus: 'in-stock',
    drawingUrl: 'https://wraccessories.com/cdn/shop/files/SKXCaseMeasurementcopy_c5b6093a-36c8-49c7-a711-5d507e539d2f.jpg?v=1713874377&width=3840',
    notes: 'Exact product page and drawing with crystal, bezel-insert and chapter-ring dimensions. Shipping is calculated at checkout.'
  }),
  documentedCaseListing({
    id: 'research-tandorio-willard-41', catalogueItemId: 'cat-case-tandorio-willard-41', supplierName: 'Tandorio Watches', sku: 'TANDORIO-WILLARD-41',
    productUrl: 'https://tandoriowatch.com/products/41mm-gold-pvd-captain-willard-watch-case-domed-sapphire?variant=50739470336285', unitPrice: 52.29, currency: 'USD', stockStatus: 'in-stock',
    drawingUrl: 'https://tandoriowatch.com/cdn/shop/files/S81f1630db2c940f0a72d54096cff3ee0j.webp?v=1766063678&width=800',
    notes: 'Exact gold-PVD 41 mm Captain Willard case variant and its dimension drawing. Shipping to South Africa remains checkout-dependent.'
  }),
  {
    id: 'research-aliexpress-nh05-case-1005010535779974',
    catalogueItemId: 'cat-case-nh05-ladies-dress-34',
    supplierName: 'AliExpress marketplace listing',
    sku: 'AE-1005010535779974',
    productUrl: 'https://www.aliexpress.com/item/1005010535779974.html',
    unitPrice: null,
    currency: 'USD',
    shippingPrice: null,
    shippingCurrency: 'USD',
    shippingDestination: 'South Africa',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: null,
    lastCheckedIso: '2026-09-27T08:34:27Z',
    provenance: {
      dataSource: 'https://sv.pricearchive.org/aliexpress.com/item/1005010535779974',
      sourceType: 'web-scrape', isDemonstrationFixture: false, retrievedAtIso: '2026-09-27T10:34:27+02:00'
    },
    notes: 'Headline states 34 mm stainless case, sapphire and 24.5 mm dial support. Exact variant price and South-African shipping were not exposed; do not substitute a teaser price.'
  },
  {
    id: 'research-aliexpress-nh05-dial-1005012168181106',
    catalogueItemId: 'cat-dial-nh05-245-mother-of-pearl',
    supplierName: 'AliExpress marketplace listing',
    sku: 'AE-1005012168181106',
    productUrl: 'https://www.aliexpress.com/item/1005012168181106.html',
    unitPrice: 9.38,
    currency: 'USD',
    shippingPrice: null,
    shippingCurrency: 'USD',
    shippingDestination: 'South Africa',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: null,
    lastCheckedIso: '2026-09-27T07:23:51Z',
    provenance: {
      dataSource: 'https://uk.pricearchive.org/aliexpress.com/item/1005012168181106',
      sourceType: 'web-scrape', isDemonstrationFixture: false, retrievedAtIso: '2026-09-27T10:34:27+02:00'
    },
    notes: '24.5 mm diamond-marker ladies dial item-price snapshot (about R153 at USD/ZAR 16.30). Shipping, exact colour, date aperture and dial feet remain checkout/engineering checks.'
  },
  {
    id: 'research-aliexpress-dial-1005010777833304',
    catalogueItemId: 'cat-dial-blank',
    supplierName: 'AliExpress marketplace listing',
    sku: 'AE-1005010777833304',
    productUrl: 'https://www.aliexpress.com/item/1005010777833304.html',
    unitPrice: 10.42,
    currency: 'USD',
    shippingPrice: null,
    shippingCurrency: 'USD',
    shippingDestination: 'South Africa',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: null,
    lastCheckedIso: '2026-09-11T15:12:18Z',
    provenance: {
      dataSource: 'https://www.pricearchive.org/aliexpress.com/item/1005010777833304',
      sourceType: 'web-scrape',
      isDemonstrationFixture: false,
      retrievedAtIso: RESEARCH_CAPTURED_AT
    },
    notes: 'Item-price snapshot only. Verify exact variant, seller, stock and South-African shipping at checkout.'
  },
  {
    id: 'research-aliexpress-chapter-1005007486441308',
    catalogueItemId: 'cat-chapter-ring',
    supplierName: 'AliExpress marketplace listing',
    sku: 'AE-1005007486441308',
    productUrl: 'https://www.aliexpress.com/item/1005007486441308.html',
    unitPrice: 6.89,
    currency: 'USD',
    shippingPrice: null,
    shippingCurrency: 'USD',
    shippingDestination: 'South Africa',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: null,
    lastCheckedIso: '2026-09-13T06:25:31Z',
    provenance: {
      dataSource: 'https://www.pricearchive.org/aliexpress.com/item/1005007486441308',
      sourceType: 'web-scrape',
      isDemonstrationFixture: false,
      retrievedAtIso: RESEARCH_CAPTURED_AT
    },
    notes: '31.3mm chapter-ring item-price snapshot. Confirm the case interface and shipping at checkout.'
  },
  {
    id: 'research-aliexpress-crystal-1005013221603872',
    catalogueItemId: 'cat-flat-sapphire',
    supplierName: 'AliExpress marketplace listing',
    sku: 'AE-1005013221603872',
    productUrl: 'https://www.aliexpress.com/item/1005013221603872.html',
    unitPrice: 7.99,
    currency: 'USD',
    shippingPrice: null,
    shippingCurrency: 'USD',
    shippingDestination: 'South Africa',
    stockStatus: 'unknown',
    status: 'active',
    verificationStatus: 'unverified',
    leadTimeDays: null,
    lastCheckedIso: '2026-09-22T07:29:13Z',
    provenance: {
      dataSource: 'https://ru.pricearchive.org/aliexpress.com/item/1005013221603872',
      sourceType: 'web-scrape',
      isDemonstrationFixture: false,
      retrievedAtIso: RESEARCH_CAPTURED_AT
    },
    notes: '31.5mm flat-sapphire item-price snapshot. Confirm profile, thickness, AR coating and shipping before selection.'
  }
];

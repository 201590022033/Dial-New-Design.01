import type { ComponentCatalogueItem, SupplierListing } from './types';

export const NH05_SUPPLIER_CHECKED_AT = '2026-10-04T10:16:00+02:00';

/** Separate product identities, not approvals of the existing presentation GLBs. */
export const nh05SupplierCandidateItems: ComponentCatalogueItem[] = [
  {
    id: 'cat-research-tandorio-nh05-case-34', kind: 'midcase',
    displayName: 'Tandorio 34mm NH05 Case - researched candidate', category: 'case',
    defaultMaterial: 'steel', defaultTexture: 'polished', linkedBandKind: null,
    nominalDimensions: { diameterMm: 34, widthMm: 34, thicknessMm: 12 },
    manufacturing: { processProfile: 'cnc', minimumFeatureMm: 0.2, minimumGapMm: 0.2, minimumStrokeWidthMm: 0.12, recommendations: ['Obtain exact-variant internal case drawing before fit approval.'] },
    softStyles: ['ladies', 'dress', 'nh05'], status: 'draft', exportEnabled: false,
    visual: { category: 'case', assetId: 'case-tandorio-nh05-research-34', representation: 'glb', status: 'provisional', note: '34mm / 12mm headline envelope; hidden interfaces, lug dimensions and shape are provisional.' },
    metadata: { tags: ['nh05', 'supplier-candidate', '34mm'], revision: 'R1', notes: 'Supplier states 34mm OD and 12mm thickness. Dial range 24.2-25mm; photo labels 24.5mm. Internal seat, holder, stem height and crystal clearance unknown. Not an exact match to the existing 10.5mm-thick presentation GLB.' }
  },
  {
    id: 'cat-research-tandorio-nh05-dial-white-245', kind: 'dial-blank',
    displayName: 'Tandorio 24.5mm White Matte NH05 Dial - researched candidate', category: 'dial',
    defaultMaterial: 'brass', defaultTexture: 'matte', linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 24.5, widthMm: 24.5, thicknessMm: 0.4 },
    manufacturing: { processProfile: 'pad-print', minimumFeatureMm: 0.12, minimumGapMm: 0.15, minimumStrokeWidthMm: 0.1, recommendations: ['Measure thickness, feet, centre opening and date aperture against TMI NH05B drawing.'] },
    softStyles: ['ladies', 'dress', 'nh05', 'white-matte'], status: 'draft', exportEnabled: false,
    visual: { category: 'dial', assetId: 'dial-nh05-white-matte-245', representation: 'glb', status: 'provisional', dialFinish: 'matte', dialColor: '#f2f2ed', note: '24.5mm substrate with provisional TMI reference aperture and baton markers, not supplier-exact detail.' },
    metadata: { tags: ['nh05', 'supplier-candidate', '24.5mm'], revision: 'R1', notes: 'Supplier states 24.5mm OD and 3 o\'clock date. Nominal 0.4mm thickness is a presentation placeholder, NOT a supplier measurement. Feet, centre hole, aperture dimensions and marker height remain unknown. No supplier-exact GLB.' }
  },
  {
    id: 'cat-research-tandorio-nh05-hands-588', kind: 'hand-set',
    displayName: 'Tandorio NH05 Luminous Hand Set 5/8/8mm - researched candidate', category: 'hands',
    defaultMaterial: 'steel', defaultTexture: 'polished', linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 8, widthMm: 0.55, thicknessMm: 0.15 },
    manufacturing: { processProfile: 'laser', minimumFeatureMm: 0.12, minimumGapMm: 0.15, minimumStrokeWidthMm: 0.12, recommendations: ['Check each actual hand bore, tube height, thickness and sweep clearance.'] },
    softStyles: ['ladies', 'dress', 'nh05', 'luminous'], status: 'draft', exportEnabled: false,
    visual: { category: 'hands', assetId: 'hands-nh05-luminous-588', representation: 'glb', status: 'provisional', handStyle: 'baton', handLengthsMm: { hour: 5, minute: 8, second: 8 }, note: 'Published tip lengths; baton/lume relief and tube geometry are presentation only. Finishes share this GLB.' },
    metadata: { tags: ['nh05', 'supplier-candidate', 'rose-gold-option'], revision: 'R1', notes: 'Supplier specifies centre-to-tip lengths hour/minute/second 5/8/8mm. Black, silver, gold, blue and rose-gold finishes advertised; exact finish stock requires confirmation. Width/thickness are presentation placeholders. No supplier bore or tube-height measurements and no supplier-exact hand GLB. Commercial price is for ONE complete three-hand set.' }
  }
];

const candidateListing = (id: string, catalogueItemId: string, path: string, sku: string, price: number | null, notes: string): SupplierListing => {
  const productUrl = `https://tandoriowatch.com/products/${path}`;
  return {
    id, catalogueItemId, supplierName: 'Tandorio Watches', sku, productUrl,
    unitPrice: price, currency: 'USD', shippingPrice: null, shippingCurrency: 'USD',
    ...(catalogueItemId === 'cat-research-tandorio-nh05-hands-588' ? { purchaseUnit: 'central-hand-set' as const } : {}),
    shippingDestination: 'South Africa', stockStatus: 'unknown', status: 'active',
    verificationStatus: 'unverified', leadTimeDays: null, lastCheckedIso: NH05_SUPPLIER_CHECKED_AT,
    provenance: { dataSource: productUrl, sourceType: 'web-scrape', isDemonstrationFixture: false, retrievedAtIso: NH05_SUPPLIER_CHECKED_AT },
    engineeringEvidence: { level: 'partial-dimensions', glbReadiness: 'provisional-only', checkedAtIso: NH05_SUPPLIER_CHECKED_AT, notes },
    notes: `${notes} Display-price snapshot only; South African shipping, taxes and exact stock are not verified. See docs/NH05-FIT-VERIFICATION-CHECKLIST.md.`
  };
};

export const nh05SupplierCandidateListings: SupplierListing[] = [
  candidateListing('research-tandorio-nh05-case-34', 'cat-research-tandorio-nh05-case-34', '34mm-nh05-watch-case-bezel-insert-ring-sapphire-glass', '5-Case Bezel (displayed option)', 76.71,
    '34mm OD, 12mm thickness, dial 24.2-25mm (photo 24.5mm). USD76.71 applies to displayed 5-Case Bezel option; package contents and finish must be checked. Stock labels conflict with purchase controls. Internal case geometry is unknown; no exact GLB.'),
  candidateListing('research-tandorio-nh05-dial-white-245', 'cat-research-tandorio-nh05-dial-white-245', '24-5mm-watch-dial-nh05-white-matte-dial?variant=50672056467741', 'NO. 1 / 50672056467741', 13.28,
    '24.5mm white matte dial, advertised NH05 fit and 3 o\'clock date. Stock labels conflict with purchase controls. Thickness, feet, centre opening, date aperture and marker height unknown.'),
  candidateListing('research-tandorio-nh05-hands-black-588', 'cat-research-tandorio-nh05-hands-588', 'nh05-hands-silver-blue-black-gold-rosegold-watch-hands-green-luminous?variant=50004173553949', 'Black / 50004173553949', 7.95,
    'One complete Black 5/8/8mm luminous NH05/NH06 hand set. Tip lengths fit within TMI maximum 9.5mm radius; bores, tube heights, thickness and complete clearances remain unverified. Do not charge this full-set price separately for each hand.'),
  candidateListing('research-tandorio-nh05-hands-rosegold-588', 'cat-research-tandorio-nh05-hands-588', 'nh05-hands-silver-blue-black-gold-rosegold-watch-hands-green-luminous', 'RoseGold (advertised option; exact variant unchecked)', null,
    'RoseGold finish advertised for the same 5/8/8mm hand set. Exact variant price and availability not checked; do not substitute Black price or the displayed range. Bores and tube heights remain unknown.')
];

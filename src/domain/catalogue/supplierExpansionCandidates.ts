import type { ComponentCatalogueItem, SupplierListing } from './types';

export const SUPPLIER_EXPANSION_CHECKED_AT = '2026-10-04T11:45:00+02:00';
export const NH36_DRAWING_URL = 'https://www.timemodule.com/upload/category/25/spec_sheet/NH36_SS.pdf';

const candidate = (id: string, kind: string, name: string, diameter: number, thickness: number, notes: string): ComponentCatalogueItem => ({
  id, kind, displayName: `${name} - researched candidate`, category: kind === 'dial-blank' ? 'dial' : 'case',
  defaultMaterial: kind === 'dial-blank' ? 'brass' : 'steel', defaultTexture: 'brushed', linkedBandKind: kind === 'dial-blank' ? 'dial-face' : null,
  nominalDimensions: { diameterMm: diameter, widthMm: diameter, thicknessMm: thickness },
  manufacturing: { processProfile: 'cnc', minimumFeatureMm: .2, minimumGapMm: .2, minimumStrokeWidthMm: .12, recommendations: ['Confirm exact SKU and all mating interfaces before fit approval.'] },
  softStyles: ['supplier-candidate', 'nh-series'], status: 'draft', exportEnabled: false,
  metadata: { tags: ['supplier-candidate', 'namoki', kind], revision: 'R1', notes }
});

export const supplierExpansionCandidateItems: ComponentCatalogueItem[] = [
  { ...candidate('cat-research-namoki-nmk903-black-38', 'midcase', 'Namoki NMK903 SKX013 Black 38mm Case', 38, 10,
    'Supplier headline dimensions: OD 38mm, lug-to-lug 44.5mm, thickness 10mm, lug width 20mm. SKX013 parts family, not SKX007 by default. Internal seats, threads and stem height unknown. Blender GLB with photo-derived drilled lugs and crown guards. Bore coordinates and contour are approximate. Crown is a separate presentation placeholder, not included in supplier case. NOT supplier-exact or fit certified.'),
    defaultTexture: 'matte', visual: { category: 'case', assetId: 'case-namoki-nmk903-black-38', representation: 'glb', status: 'provisional', caseFinish: 'black-pvd', crownAngleDeg: -30, note: 'Published external envelope; photo-derived contours and drilling. Internal seats and separate crown placement unverified.' } },
  { ...candidate('cat-research-namoki-slim-sapphire-back', 'caseback', 'Namoki SKX Slim Sapphire Caseback (Grey Spacer)', 0, 1.2,
    'Supplier thickness 1.2mm and grey NH spacer restriction. Outer diameter, thread diameter/pitch, gasket seat and rotor clearance not published in inspected page. Zero diameter means UNKNOWN, not a zero-size physical component. Research-only; no exact preview or fit approval. Supplier water-resistance claim is not assembled-watch certification.'), researchOnly: true },
  { ...candidate('cat-research-namoki-slim-solid-back', 'caseback', 'Namoki SKX Slim Brushed Solid Caseback', 0, .8,
    'Supplier thickness 0.8mm; grey NH spacer only. Supplier advertises SKX007/009/SKX013 family fit. OD, thread pitch, gasket seat and axial clearance unresolved; zero diameter means UNKNOWN. Research-only; no dimensional preview or fit approval.'), researchOnly: true },
  { ...candidate('cat-research-namoki-108-silver-dial', 'dial-blank', 'Namoki 108 Sector Sunburst Silver Dial', 28.5, .4,
    'Supplier OD 28.5mm; four feet advertised for 3/4h configurations with two unused feet removed. Actual foot coordinates, aperture and thickness unknown. 0.4mm is a presentation placeholder. Blender GLB with photo-derived railway sector track and 12/3/6/9 numerals; artwork approximate, supplier logo omitted. No feet or fit certification.'),
    defaultTexture: 'sunburst', visual: { category: 'dial', assetId: 'dial-namoki-108-silver-285', representation: 'glb', status: 'provisional', dialFinish: 'sunburst', dialColor: '#c4c8cd', note: 'Photo-derived sector artwork, not supplier-exact. Thickness and interfaces unverified.' } },
  { ...candidate('cat-research-namoki-nh36-arabic-4h', 'movement', 'Namoki NH36A Arabic White Day-Date (Factory Standard 4H)', 27.4, 5.32,
    'TMI NH36A PDF cover: body OD 27.40mm, spacer OD 29.36mm, height 5.32mm. Casing/hand-fitting pages distinguish Type M/L pinion heights. Seller-selected Factory Standard 4H day-wheel variant; not interchangeable with 3H day-wheel configuration. Exact pinion type, origin, delivered stock and matching case remain unchecked. Research-only: select calibre through the supported movement workflow, not by replacing a case.'), researchOnly: true }
];

const offer = (id: string, itemId: string, path: string, price: number, sku: string, notes: string, drawingUrl?: string): SupplierListing => ({
  id, catalogueItemId: itemId, supplierName: 'namokiMODS', sku, productUrl: `https://www.namokimods.com/products/${path}`,
  unitPrice: price, currency: 'SGD', shippingPrice: null, shippingCurrency: 'SGD', shippingDestination: 'South Africa',
  stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified', leadTimeDays: null, lastCheckedIso: SUPPLIER_EXPANSION_CHECKED_AT,
  provenance: { dataSource: `https://www.namokimods.com/products/${path}`, sourceType: 'web-scrape', isDemonstrationFixture: false, retrievedAtIso: SUPPLIER_EXPANSION_CHECKED_AT },
  engineeringEvidence: { level: drawingUrl ? 'dimensioned-drawing' : 'partial-dimensions', glbReadiness: drawingUrl ? 'provisional-only' : 'blocked', checkedAtIso: SUPPLIER_EXPANSION_CHECKED_AT, drawingUrl, notes },
  notes: `${notes} Displayed item-price snapshot, not a landed quote. Stock text and purchase controls can disagree; confirm exact variant. South African shipping, taxes and duties remain unknown. Free-shipping thresholds are not proof of free shipping on this item. Rand conversion uses the separately dated application FX snapshot.`
});

export const supplierExpansionCandidateListings: SupplierListing[] = [
  offer('research-namoki-nmk903-black-38', 'cat-research-namoki-nmk903-black-38', 'nmk903-skx013-watch-case-pvd-black-finish', 88, 'NMK903 PVD Matte Black', '38/44.5/10/20mm headline case dimensions; no complete internal engineering drawing.'),
  offer('research-namoki-slim-sapphire-back', 'cat-research-namoki-slim-sapphire-back', 'skx-slim-sapphire-caseback?variant=40519290716335', 48, 'For Grey Spacer (NH35/NH36) / 40519290716335', '1.2mm thickness; grey NH spacer only. Thread and gasket dimensions unknown.'),
  offer('research-namoki-slim-solid-back', 'cat-research-namoki-slim-solid-back', 'skx-slim-caseback-brushed-finish', 25, 'Brushed finish (exact variant requires confirmation)', 'Slim solid alternative; inspected listing does not establish a complete mating drawing.'),
  offer('research-namoki-108-silver-dial', 'cat-research-namoki-108-silver-dial', 'watch-dial-108-minimal-tool-dial-sunburst-silver', 39, '108 Sector Sunburst Silver', '28.5mm OD and four removable feet; thickness and precise feet coordinates unknown.'),
  offer('research-namoki-nh36-arabic-4h', 'cat-research-namoki-nh36-arabic-4h', 'seiko-sii-nh36a-automatic-movement-arabic-white', 125, 'Factory Standard (4H), Arabic White', 'TMI drawing describes base NH36A, not seller-specific day-wheel or pinion variant certification. Cover plus Casing and Hand Fitting pages visually inspected.', NH36_DRAWING_URL)
];

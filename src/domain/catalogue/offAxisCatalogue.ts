import layouts from '@/domain/crown/offAxisLayouts.json';
import { crownCatalogueItems, presentationEvidence } from '@/domain/crown/catalogue';
import type { EvidenceValue, CrownAxisDatumV1 } from '@/domain/crown/types';
import type { OffAxisCasePlatform } from '@/domain/crown/offAxisPlatform';
import type { ComponentCatalogueItem, SupplierListing } from './types';

export const OFF_AXIS_CHECKED_AT = '2026-10-10T10:27:19Z';
const unknown = <T,>(reason: string): EvidenceValue<T> => ({ status: 'unknown', reason });
const supplier = <T,>(value: T, source: string): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'supplier-statement', source, retrievedAtIso: OFF_AXIS_CHECKED_AT } });
const missing = 'No exact mating drawing or measured installation recovered.';
export const offAxisCaseItems: ComponentCatalogueItem[] = layouts.map(layout => {
  const platform: OffAxisCasePlatform = {
    schema: 'off-axis-platform/v1', id: layout.id, caseCatalogueId: layout.caseId, sourceUrl: layout.source,
    variantId: layout.variantId, sku: layout.sku, identityStatus: 'requires-confirmation', physicalFit: 'unqualified',
    presentationMovementIds: layout.movementClaims,
    envelope: { shroudDiameterMm: supplier(layout.shroudMm, layout.source), midcaseDiameterMm: unknown(missing), bezelOuterMm: unknown(missing), bezelInnerMm: unknown(missing), dialSeatMm: unknown(missing), crystalSeatMm: unknown(missing), casebackDiameterMm: unknown(missing), lugWidthMm: supplier(layout.lugWidthMm, layout.source), lugToLugMm: layout.lugToLugMm ? supplier(layout.lugToLugMm, layout.source) : unknown(missing) },
    supplierMovements: layout.id === 'nmk920-brushed' ? unknown('Supplier states SKX007/SRPD parts family; exact movement installation not enumerated.') : supplier(layout.movementClaims, layout.source),
    dialRangeMm: layout.dialMinMm && layout.dialMaxMm ? supplier([layout.dialMinMm, layout.dialMaxMm] as [number, number], layout.source) : unknown(missing),
    installation: { movementRotationDeg: unknown(missing), dialRotationDeg: unknown(missing), calendarApertureDeg: unknown(missing), dateWheelOrientationDeg: unknown(missing), stemHeightMm: unknown(missing), spacerId: unknown(missing), dialFeetInterface: unknown(missing), loading: unknown('Rear/front service path needs exact variant confirmation.') },
    notes: layout.notes
  };
  const axis: CrownAxisDatumV1 = { schema: 'crown-axis/v1', axisId: 'crown-main', clockwiseFrom3hDeg: { status: 'known', value: layout.clockwiseDeg, evidence: { kind: 'visual-approximation', source: `${layout.source}; ${layout.positionWording}; presentation angle, not measured fit`, retrievedAtIso: OFF_AXIS_CHECKED_AT } }, interfaceRadiusMm: presentationEvidence(layout.interfaceRadiusMm), stemHeightMm: presentationEvidence(0), supplierPosition: layout.id === 'nmk920-brushed' ? unknown('No exact numeric angle or clock wording published for current SKU.') : supplier(layout.positionWording, layout.source) };
  return { id: layout.caseId, kind: 'midcase', displayName: layout.name, category: 'case', defaultMaterial: 'steel', defaultTexture: layout.finish === 'black-pvd' ? 'matte' : 'brushed', linkedBandKind: null,
    nominalDimensions: { diameterMm: layout.shroudMm, widthMm: layout.shroudMm, thicknessMm: layout.heightMm },
    manufacturing: { processProfile: 'cnc', minimumFeatureMm: .2, minimumGapMm: .2, minimumStrokeWidthMm: .12, recommendations: ['Presentation envelope only. No manufacturing export or physical-fit approval.'] },
    softStyles: ['diver', 'tuna', 'off-axis', 'presentation'], status: 'draft', exportEnabled: false,
    metadata: { tags: ['case', 'off-axis', 'presentation-only', `${layout.shroudMm}mm`], revision: 'C7-P1', notes: layout.notes },
    offAxisPlatform: platform, crownAxes: [axis], suppliedCrown: { catalogueItemId: layout.crownId, evidence: supplier('Included operating crown; dimensions and interfaces unqualified', layout.source) },
    ...(layout.id === 'nmk920-brushed' ? { suppliedBezel: { catalogueItemId: 'cat-bezel-nmk920-package', evidence: supplier('Included bezel; presentation envelope, unmeasured interfaces', layout.source) } } : {}),
    visual: { category: 'case', assetId: layout.assetId, representation: 'glb', status: 'provisional', caseFinish: layout.finish as 'steel' | 'black-pvd', note: `${layout.heightBasis}; canonical approximate axis. ${layout.notes}` }
  };
});

export const offAxisPackageCrowns: ComponentCatalogueItem[] = layouts.map(layout => {
  const original = crownCatalogueItems.find(item => item.id === 'cat-crown-fine-fluted')!;
  const spec = structuredClone(original.crownSpecification!);
  spec.closure = layout.id === 'tandorio465-black' ? supplier('screw-down', layout.source) : unknown('Included crown closure not specified for this exact listing.');
  return { ...original, id: layout.crownId, displayName: `${layout.id === 'nmk920-brushed' ? 'NMK920' : 'Tandorio 46.5'} included crown — envelope preview`, crownSpecification: spec,
    metadata: { tags: ['crown', 'concept', 'case-bundle'], revision: 'C7-P1', notes: 'Supplier states included crown; 6.5/6.9 x 3.5 mm head is a generic presentation envelope, not a measured supplied head.' } };
});

export const offAxisStrapItem: ComponentCatalogueItem = {
  id: 'cat-strap-rubber-22-preview', kind: 'strap-integration', displayName: '22mm strap interface — unpriced preview', category: 'external', defaultMaterial: 'rubber', defaultTexture: 'matte', linkedBandKind: null,
  nominalDimensions: { diameterMm: 22, widthMm: 22, thicknessMm: 3 }, manufacturing: { processProfile: 'cnc', minimumFeatureMm: .2, minimumGapMm: .2, minimumStrokeWidthMm: .12, recommendations: ['Select exact strap and spring bars before procurement.'] }, softStyles: ['diver'], status: 'draft', exportEnabled: false,
  metadata: { tags: ['strap', 'off-axis-accessory', 'presentation-only'], revision: 'C7-P1', notes: 'Only the nominal 22 mm interface is represented; no supplier, curvature, endlink or spring-bar fit qualification.' }
};

export const offAxisPackageBezel: ComponentCatalogueItem = {
  id: 'cat-bezel-nmk920-package', kind: 'rotating-bezel', displayName: 'NMK920 included bezel — envelope preview', category: 'rings', defaultMaterial: 'steel', defaultTexture: 'knurled', linkedBandKind: 'outer-bezel',
  nominalDimensions: { diameterMm: 38, widthMm: 3.5, thicknessMm: 2.8 }, manufacturing: { processProfile: 'cnc', minimumFeatureMm: .2, minimumGapMm: .2, minimumStrokeWidthMm: .12, recommendations: ['Generic inherited bezel envelope only; dimensions and mating interfaces unqualified.'] }, softStyles: ['diver'], status: 'draft', exportEnabled: false,
  metadata: { tags: ['bezel', 'case-bundle', 'presentation-only'], revision: 'C7-P1', notes: 'Included bezel supplier statement does not establish the rendered 38 mm envelope. Existing valid appearance is retained; physical fit unknown.' }
};

export const offAxisSupplierListings: SupplierListing[] = layouts.map(layout => {
  const namoki = layout.id === 'nmk920-brushed';
  const currency = namoki ? 'SGD' : 'USD';
  return { id: namoki ? 'research-namoki-nmk920-tuna' : 'research-tandorio-tuna-465-black', catalogueItemId: layout.caseId, supplierName: namoki ? 'namokiMODS' : 'Tandorio Watches', sku: layout.sku,
    productUrl: `${layout.source}?variant=${layout.variantId}`, unitPrice: namoki ? 195 : 60.9, currency, shippingPrice: null, shippingCurrency: currency, shippingDestination: 'ZA', stockStatus: namoki ? 'out-of-stock' : 'unknown', status: 'active', verificationStatus: 'unverified', directOrderCapability: false, lastCheckedIso: OFF_AXIS_CHECKED_AT,
    provenance: { dataSource: layout.source, sourceType: 'web-scrape', isDemonstrationFixture: false, retrievedAtIso: OFF_AXIS_CHECKED_AT },
    engineeringEvidence: { level: 'headline-only', glbReadiness: 'provisional-only', checkedAtIso: OFF_AXIS_CHECKED_AT, notes: layout.notes },
    packageContents: [{ role: 'crown', catalogueItemId: layout.crownId, description: 'Included operating crown; generic head envelope only', evidence: supplier('Included with case', layout.source) }, ...(namoki ? [{ role: 'bezel' as const, catalogueItemId: offAxisPackageBezel.id, description: 'Included bezel; exact dimensions unqualified. A separately selected bezel is an additional replacement.', evidence: supplier('Included with case', layout.source) }] : [])],
    priceSnapshot: { variant: `${layout.variantId}; ${layout.sku}; current exact variant identity requires confirmation${namoki ? `; old alias ${layout.legacySku}` : ''}`, checkedAtIso: OFF_AXIS_CHECKED_AT,
      fx: { currency, zarPerUnit: namoki ? 16.5331 / 1.2804 : 16.5331, sourceUrl: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR,SGD', checkedAtIso: OFF_AXIS_CHECKED_AT }, shippingToSa: 'unknown', taxAssumptions: 'Indicative parts conversion only; FX observation dated 2026-10-09, retrieved 2026-10-10. SA VAT/duties/import fees and shipping unquoted.' },
    notes: `${layout.notes} Product-page price rechecked; public variant JSON requests returned 403, so C0 variant IDs/SKUs are retained with explicit confirmation required. ${namoki ? 'Page sold out.' : 'Prior API/page stock conflict unresolved; no discount inferred.'} SA shipping unknown.`
  };
});

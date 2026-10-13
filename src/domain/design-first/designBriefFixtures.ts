import type { DesignBriefV1, DesignMatchResultV1 } from './designBrief';
import type { EvidenceField } from './evidence';

/** Synthetic contract examples only. Not registry entries or real supplier claims. */
export const syntheticBriefDimension: EvidenceField<number> = {
  state: 'recorded', value: 28.5, review: 'reviewed',
  source: { id: 'synthetic-dial-dimension', kind: 'synthetic-fixture', locator: 'fixture://design-first/dial', capturedAt: '2026-10-12T00:00:00Z' }
};
export const syntheticDesignBrief: DesignBriefV1 = {
  version: 1, mode: 'concept',
  assembly: { id: 'synthetic-project', revision: 'synthetic-r1', identityToken: 'synthetic-content-token-1' },
  target: { slot: 'dial', partInstanceId: 'synthetic-dial', catalogueItemId: 'synthetic-catalogue-dial' },
  desiredDimensions: { diameterMm: syntheticBriefDimension, thicknessMm: { state: 'unknown', reason: 'Creative concept has no thickness requirement yet.' } },
  stylePreferences: { colour: 'blue', finish: 'sunburst' },
  permissions: { preserve: ['parts.synthetic-dial.color'], allowChanges: ['parts.synthetic-dial.dimensions.diameterMm'], lockedPartIds: [] }
};
export const syntheticSelectedCaseBrief: DesignBriefV1 = {
  ...syntheticDesignBrief, mode: 'selected-case',
  selectedCase: { partInstanceId: 'synthetic-case', catalogueItemId: 'synthetic-catalogue-case' }
};
export const syntheticMatchResults: readonly DesignMatchResultV1[] = [
  {
    version: 1, briefIdentityToken: syntheticDesignBrief.assembly.identityToken,
    catalogueItemId: 'synthetic-candidate-unknown', supplierListingIds: [], group: 'needs-evidence', visualScore: 1,
    reasons: [{ code: 'synthetic-seat-unknown', explanation: 'Synthetic case seat dimensions are missing.', evidence: { state: 'unknown', reason: 'No supplier measurement exists for this fixture.' } }], adjustments: []
  },
  {
    version: 1, briefIdentityToken: syntheticDesignBrief.assembly.identityToken,
    catalogueItemId: 'synthetic-candidate-adjustment', supplierListingIds: ['synthetic-offer-1'], group: 'changes-required', visualScore: 0.5,
    reasons: [{ code: 'synthetic-dial-resize', explanation: 'Illustrative proposal only; fit remains unqualified.', evidence: syntheticBriefDimension }],
    adjustments: [{ partInstanceId: 'synthetic-dial', property: 'parts.synthetic-dial.dimensions.diameterMm', before: 29, after: 28.5, reason: 'Illustrate a smaller dial proposal.', reversible: true }]
  },
  {
    version: 1, briefIdentityToken: syntheticDesignBrief.assembly.identityToken,
    catalogueItemId: 'synthetic-candidate-incompatible', supplierListingIds: [], group: 'incompatible', visualScore: 1,
    reasons: [{ code: 'synthetic-wrong-interface', explanation: 'Illustrative wrong interface, despite visual resemblance.', evidence: { state: 'assumed', value: 'wrong-interface', reason: 'Deliberately incompatible synthetic scenario.' } }], adjustments: []
  }
];

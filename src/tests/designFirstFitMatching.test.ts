import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { createSyntheticKnownCaseConstraints } from '@/domain/design-first/caseConstraintFixtures';
import { captureDesignBrief } from '@/domain/design-first/designBriefExtraction';
import { designMatchResultErrors } from '@/domain/design-first/designBrief';
import { evaluateDesignCandidate } from '@/domain/design-first/fitMatching';
import type { EvidenceField } from '@/domain/design-first/evidence';

const recorded = (value: number): EvidenceField<number> => ({ state: 'recorded', value, review: 'reviewed',
  source: { id: 'test-only-reviewed-drawing', kind: 'manufacturer-drawing', locator: 'https://example.test/test-only-drawing', capturedAt: '2026-10-01T00:00:00Z' } });
function setup() {
  const assembly = createDefaultWatchAssembly();
  const base = getCatalogueItem('cat-midcase')!;
  const fixture = createSyntheticKnownCaseConstraints(31);
  const caseItem: ComponentCatalogueItem = { ...base, id: 'test-case', caseConstraints: {
    ...fixture, catalogueItemId: 'test-case', interfaces: { ...fixture.interfaces,
      crystalSeatDiameterMm: recorded(31), crystalSeatDepthMm: recorded(2), dialSeatDiameterMm: recorded(28.5) } } };
  assembly.parts['inst-midcase'] = { ...assembly.parts['inst-midcase']!, catalogueItemId: caseItem.id };
  const original = getCatalogueItem('cat-crystal')!;
  assembly.parts['inst-crystal']!.dimensions = { ...assembly.parts['inst-crystal']!.dimensions, diameterMm: 31, thicknessMm: 2, widthMm: 0 };
  const candidate: ComponentCatalogueItem = { ...original, id: 'test-crystal',
    nominalDimensions: { diameterMm: 31, widthMm: 0, thicknessMm: 2 },
    engineeringSpecs: { crystal: { outerDiameterMm: 31, thicknessMm: 2 } },
    fitEvidence: { schema: 'component-fit-evidence/v1', catalogueItemId: 'test-crystal', measurements: { outerDiameterMm: recorded(31), thicknessMm: recorded(2) } } };
  const items = [caseItem, original, candidate];
  const brief = { ...captureDesignBrief(assembly, 'inst-crystal', items, { version: 1, mode: 'selected-case', preserveDimensions: false, preserveAppearance: false, styleNotes: '' }), stylePreferences: {} };
  return { assembly, brief, candidate, items, supplierListings: [] as SupplierListing[] };
}

describe('DF3 evidence-aware dimensional matching', () => {
  it('returns scoped recorded dimensional matches only with reviewed nonsynthetic evidence', () => {
    const options = setup();
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('fits-recorded-dimensions');
    expect(result.reasons.some(reason => reason.explanation.includes('not installation or sealing approval'))).toBe(true);
    expect(designMatchResultErrors(result)).toEqual([]);
  });

  it.each(['unknown', 'assumed', 'unreviewed', 'synthetic'] as const)('keeps %s critical dimensions in needs-evidence', state => {
    const options = setup();
    const field: EvidenceField<number> = state === 'unknown' ? { state, reason: 'Test missing measurement' }
      : state === 'assumed' ? { state, value: 31, reason: 'Test assumption' }
      : { ...(recorded(31) as Extract<EvidenceField<number>, { state: 'recorded' }>),
        ...(state === 'unreviewed' ? { review: 'unreviewed' as const } : { source: { id: 'synthetic', kind: 'synthetic-fixture' as const, locator: 'test-fixture:seat', capturedAt: '2026-10-01T00:00:00Z' } }) };
    options.candidate = { ...options.candidate, fitEvidence: { ...options.candidate.fitEvidence!, measurements: { ...options.candidate.fitEvidence!.measurements, outerDiameterMm: field } } };
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('needs-evidence');
    expect(designMatchResultErrors(result)).toEqual([]);
  });

  it('returns allowed authored adjustments without resizing hardware', () => {
    const options = setup();
    options.brief = { ...options.brief, desiredDimensions: { ...options.brief.desiredDimensions, thicknessMm: { state: 'assumed', value: 1, reason: 'Authored wish' } } };
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('changes-required');
    expect(result.adjustments).toContainEqual(expect.objectContaining({ property: 'target.dimensions.thicknessMm', before: 1, after: 2, reversible: true }));
    expect(designMatchResultErrors(result)).toEqual([]);
  });

  it('rejects preserve or lock violations', () => {
    const options = setup();
    options.brief = { ...options.brief, desiredDimensions: { ...options.brief.desiredDimensions, thicknessMm: { state: 'assumed', value: 1, reason: 'Preserved wish' } },
      permissions: { ...options.brief.permissions, preserve: ['target.dimensions.thicknessMm'], allowChanges: [] } };
    expect(evaluateDesignCandidate(options).group).toBe('incompatible');
    options.assembly.parts['inst-crystal']!.locked = true;
    expect(evaluateDesignCandidate(options).reasons.some(reason => reason.code === 'LOCKED_TARGET')).toBe(true);
  });

  it('rejects hard seat and depth mismatch despite arbitrary manufacturing tolerance', () => {
    const options = setup();
    options.assembly.globalDimensions.manufacturingToleranceMm = 100;
    options.candidate = { ...options.candidate, fitEvidence: undefined,
      engineeringSpecs: { crystal: { outerDiameterMm: 31.2, thicknessMm: 2.2 } },
      nominalDimensions: { ...options.candidate.nominalDimensions, diameterMm: 31.2, thicknessMm: 2.2 } };
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('incompatible');
    expect(result.reasons.map(reason => reason.code)).toContain('CRYSTAL_DIAMETER_MISMATCH');
    expect(result.reasons.map(reason => reason.code)).toContain('CRYSTAL_DEPTH_MISMATCH');
  });

  it('reports typed-versus-raw contradictions instead of hiding them', () => {
    const options = setup();
    options.candidate = { ...options.candidate, engineeringSpecs: { crystal: { outerDiameterMm: 30, thicknessMm: 2 } } };
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('needs-evidence');
    expect(result.reasons.some(reason => reason.code === 'CONFLICTING_outerDiameterMm')).toBe(true);
    expect(designMatchResultErrors(result)).toEqual([]);
  });

  it('requires missing dial installation evidence even when recorded diameter fits', () => {
    const options = setup();
    const dial = getCatalogueItem('cat-dial-blank')!;
    const candidate: ComponentCatalogueItem = { ...dial, id: 'test-dial', nominalDimensions: { diameterMm: 28, thicknessMm: .4, widthMm: 0 },
      fitEvidence: { schema: 'component-fit-evidence/v1', catalogueItemId: 'test-dial', measurements: { outerDiameterMm: recorded(28), thicknessMm: recorded(.4) } } };
    const items = [...options.items, dial, candidate];
    const brief = { ...captureDesignBrief(options.assembly, 'inst-dial-blank', items, { version: 1, mode: 'selected-case', preserveDimensions: false, preserveAppearance: false, styleNotes: '' }), stylePreferences: {} };
    const result = evaluateDesignCandidate({ ...options, candidate, items, brief });
    expect(result.group).toBe('needs-evidence');
    expect(result.reasons.some(reason => reason.code === 'DIAL_INSTALLATION_EVIDENCE')).toBe(true);
  });

  it('rejects wrong hand role and bore and never treats movement library values as recorded evidence', () => {
    const options = setup();
    const hour = getCatalogueItem('cat-hour-hand')!;
    const minute = getCatalogueItem('cat-minute-hand')!;
    const items = [...options.items, hour, minute];
    const brief = { ...captureDesignBrief(options.assembly, 'inst-hour-hand', items, { version: 1, mode: 'selected-case', preserveDimensions: false, preserveAppearance: false, styleNotes: '' }), stylePreferences: {} };
    options.assembly.globalDimensions.manufacturingToleranceMm = 100;
    const wrong = evaluateDesignCandidate({ ...options, candidate: minute, brief, items });
    expect(wrong.group).toBe('incompatible');
    expect(wrong.reasons.some(reason => reason.code === 'WRONG_HAND_ROLE')).toBe(true);
    expect(wrong.reasons.some(reason => reason.code === 'HAND_BORE_MISMATCH')).toBe(true);
    const matching = evaluateDesignCandidate({ ...options, candidate: hour, brief, items });
    expect(matching.group).toBe('needs-evidence');
  });

  it('records allowed appearance changes and normalizes equivalent colour spellings', () => {
    const options = setup();
    options.brief = { ...options.brief, stylePreferences: { color: '#fff' }, permissions: { ...options.brief.permissions, preserve: ['target.appearance.color'], allowChanges: [] } };
    options.candidate = { ...options.candidate, visual: { category: 'crystal', assetId: 'test', representation: 'procedural', status: 'provisional', dialColor: '#FFFFFF' } };
    expect(evaluateDesignCandidate(options).group).toBe('fits-recorded-dimensions');
    options.brief = { ...options.brief, stylePreferences: { material: 'gold' }, permissions: { ...options.brief.permissions, preserve: [], allowChanges: ['target.appearance.material'] } };
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('changes-required');
    expect(result.adjustments.some(adjustment => adjustment.property === 'target.appearance.material')).toBe(true);
  });

  it('includes only candidate offer references sorted, without mutating inputs or inheriting unrelated assembly red', () => {
    const options = setup();
    options.assembly.parts['inst-dial-blank']!.dimensions.diameterMm = 100;
    options.supplierListings = ['z', 'a', 'z'].map(id => ({ id, catalogueItemId: options.candidate.id } as SupplierListing));
    options.supplierListings.push({ id: 'unrelated', catalogueItemId: 'other' } as SupplierListing);
    const before = JSON.stringify(options);
    const result = evaluateDesignCandidate(options);
    expect(result.group).toBe('fits-recorded-dimensions');
    expect(result.supplierListingIds).toEqual(['a', 'z']);
    expect(JSON.stringify(options)).toBe(before);
  });

  it.each([
    ['inst-chapter-ring', 'chapter-ring', 'CHAPTER_RING_DIAMETER_MISMATCH'],
    ['inst-strap-integration', 'strap', 'STRAP_WIDTH_MISMATCH'],
  ] as const)('screens explicit negative fitting dimensions for %s', (id, slot, code) => {
    const options = setup();
    const target = options.assembly.parts[id]!;
    const base = getCatalogueItem(target.catalogueItemId)!;
    const candidate: ComponentCatalogueItem = { ...base, id: `test-${slot}`, fitEvidence: undefined,
      nominalDimensions: { diameterMm: 35, thicknessMm: 2, widthMm: 25 },
      ...(slot === 'strap' ? { visual: { category: 'strap' as const, assetId: 'test', representation: 'procedural' as const, status: 'provisional' as const } } : {}) };
    const items = [...options.items, base, candidate];
    const brief = { ...options.brief, target: { partInstanceId: id, catalogueItemId: target.catalogueItemId, slot },
      desiredDimensions: {}, stylePreferences: {} };
    const result = evaluateDesignCandidate({ ...options, candidate, items, brief });
    expect(result.group).toBe('incompatible');
    expect(result.reasons.some(reason => reason.code === code)).toBe(true);
  });

  it.each(['caseback', 'rotating-bezel'] as const)('does not confuse overall %s size with its mounting diameter', slot => {
    const options = setup();
    const id = slot === 'caseback' ? 'inst-caseback' : 'inst-rotating-bezel';
    const target = options.assembly.parts[id]!;
    const base = getCatalogueItem(target.catalogueItemId)!;
    const candidate: ComponentCatalogueItem = { ...base, id: `test-${slot}`, fitEvidence: undefined,
      nominalDimensions: { diameterMm: 70, widthMm: 20, thicknessMm: 2 },
      engineeringSpecs: slot === 'rotating-bezel' ? { bezel: { outerDiameterMm: 70, innerDiameterMm: 30, insertInnerDiameterMm: 30, insertOuterDiameterMm: 65 } } : undefined };
    const items = [...options.items, base, candidate];
    const brief = { ...options.brief, target: { partInstanceId: id, catalogueItemId: target.catalogueItemId, slot }, desiredDimensions: {}, stylePreferences: {} };
    const unknown = evaluateDesignCandidate({ ...options, candidate, items, brief });
    expect(unknown.group).toBe('needs-evidence');
    expect(unknown.reasons.some(reason => reason.code === 'CASEBACK_DIAMETER_MISMATCH' || reason.code === 'BEZEL_OUTER_DIAMETER_MISMATCH')).toBe(false);
    const measured: ComponentCatalogueItem = { ...candidate, fitEvidence: { schema: 'component-fit-evidence/v1', catalogueItemId: candidate.id,
      measurements: slot === 'caseback' ? { mountingDiameterMm: recorded(40) }
        : { mountingInnerDiameterMm: recorded(40), mountingOuterDiameterMm: recorded(45) } } };
    const mismatch = evaluateDesignCandidate({ ...options, candidate: measured, items: [...items, measured], brief });
    expect(mismatch.group).toBe('incompatible');
    expect(mismatch.reasons.some(reason => reason.code === 'CASEBACK_DIAMETER_MISMATCH' || reason.code === 'BEZEL_INNER_DIAMETER_MISMATCH')).toBe(true);
  });

  it('screens a candidate case explicit dial seat against the current actual dial', () => {
    const options = setup();
    const original = options.items.find(item => item.id === 'test-case')!;
    const candidate: ComponentCatalogueItem = { ...original, id: 'narrow-case', caseConstraints: undefined,
      engineeringSpecs: { case: { dialSeatDiameterMm: 20, crystalSeatDiameterMm: 31, cavityDiameterMm: 29, cavityDepthMm: 6 } } };
    const items = [...options.items, getCatalogueItem('cat-dial-blank')!, candidate];
    const brief = { ...options.brief, target: { partInstanceId: 'inst-midcase', catalogueItemId: 'test-case', slot: 'case' as const }, desiredDimensions: {}, stylePreferences: {} };
    const result = evaluateDesignCandidate({ ...options, candidate, items, brief });
    expect(result.group).toBe('incompatible');
    expect(result.reasons.some(reason => reason.code === 'CASE_DIAL_SEAT_MISMATCH')).toBe(true);
  });
});

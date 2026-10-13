import { describe, expect, it } from 'vitest';
import { caseConstraintErrors, designBriefErrors, designMatchResultErrors, parseSupplierDraft, supplierVariantKey } from '@/domain/design-first';
import { createSyntheticKnownCaseConstraints, createSyntheticIncompleteCaseConstraints, createSyntheticConceptCaseConstraints } from '@/domain/design-first/caseConstraintFixtures';
import { syntheticDesignBrief, syntheticMatchResults } from '@/domain/design-first/designBriefFixtures';
import { supplierDraftFixtures } from '@/domain/design-first/supplierDraftFixtures';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';

describe('DF0 coordinated contracts', () => {
  it('validates all three example modes without changing the live assembly or catalogue', () => {
    const assemblyBefore = JSON.stringify(useWatchAssemblyStore.getState().assembly);
    const catalogueBefore = JSON.stringify(useCatalogueStore.getState().items);
    for (const constraints of [createSyntheticKnownCaseConstraints(), createSyntheticIncompleteCaseConstraints(), createSyntheticConceptCaseConstraints()]) {
      expect(caseConstraintErrors(JSON.parse(JSON.stringify(constraints)))).toEqual([]);
      const brief = constraints.mode === 'concept' ? syntheticDesignBrief : {
        ...syntheticDesignBrief, mode: 'selected-case',
        selectedCase: { partInstanceId: 'fixture-case-instance', catalogueItemId: constraints.catalogueItemId! }
      };
      expect(designBriefErrors(brief)).toEqual([]);
    }
    for (const draft of supplierDraftFixtures) expect(parseSupplierDraft(JSON.parse(JSON.stringify(draft)))).toEqual(draft);
    for (const result of syntheticMatchResults) expect(designMatchResultErrors(result)).toEqual([]);
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(assemblyBefore);
    expect(JSON.stringify(useCatalogueStore.getState().items)).toBe(catalogueBefore);
  });
  it('keeps identical case diameters, source variants and fit evidence independent', () => {
    const one = createSyntheticKnownCaseConstraints(31);
    const two = createSyntheticKnownCaseConstraints(32);
    expect(one.outerDiameterMm).toEqual(two.outerDiameterMm);
    expect(one.catalogueItemId).not.toBe(two.catalogueItemId);
    expect(one.interfaces.crystalSeatDiameterMm).not.toEqual(two.interfaces.crystalSeatDiameterMm);
    expect(supplierVariantKey(supplierDraftFixtures[0]!.identity)).not.toBe(supplierVariantKey(supplierDraftFixtures[1]!.identity));
    const unknownMatch = syntheticMatchResults[0]!;
    expect(unknownMatch.visualScore).toBe(1);
    expect(unknownMatch.group).toBe('needs-evidence');
    expect(designMatchResultErrors({ ...unknownMatch, group: 'fits-recorded-dimensions' })).not.toEqual([]);
    expect(supplierDraftFixtures.every(draft => draft.fitQualification === 'not-assessed')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { designBriefErrors, designMatchResultErrors } from '@/domain/design-first/designBrief';
import { syntheticDesignBrief, syntheticMatchResults, syntheticSelectedCaseBrief } from '@/domain/design-first/designBriefFixtures';

describe('DF0 readonly design brief and result contracts', () => {
  it('accepts both modes, explicit unknowns and stable JSON round trips', () => {
    for (const brief of [syntheticDesignBrief, syntheticSelectedCaseBrief]) {
      const roundtrip: unknown = JSON.parse(JSON.stringify(brief));
      expect(roundtrip).toEqual(brief);
      expect(designBriefErrors(roundtrip)).toEqual([]);
    }
    for (const result of syntheticMatchResults) expect(designMatchResultErrors(JSON.parse(JSON.stringify(result)))).toEqual([]);
  });
  it('rejects malformed versions, modes, dimensions and missing references', () => {
    for (const patch of [{ version: 2 }, { target: {} }, { assembly: {} }, { mode: 'selected-case' }, { desiredDimensions: { diameterMm: { state: 'unknown' } } }, { desiredDimensions: { diameterMm: { state: 'assumed', value: 0, reason: 'Missing' } } }]) {
      expect(designBriefErrors({ ...syntheticDesignBrief, ...patch }).length).toBeGreaterThan(0);
    }
    for (const bad of [null, [], 'brief']) expect(designBriefErrors(bad).length).toBeGreaterThan(0);
  });
  it('validates reference existence, current token and locks without mutating the assembly', () => {
    const assembly = createDefaultWatchAssembly();
    const before = JSON.stringify(assembly);
    expect(designBriefErrors(syntheticDesignBrief, assembly, 'different-content-token')).toEqual(expect.arrayContaining([
      'Assembly content identity is stale.', 'Component reference is missing or stale: synthetic-dial.'
    ]));
    expect(JSON.stringify(assembly)).toBe(before);
    expect(designBriefErrors({ ...syntheticDesignBrief, permissions: { preserve: ['diameterMm'], allowChanges: ['diameterMm'], lockedPartIds: [] } })).toContain('A property cannot be both preserved and changeable.');
  });
  it('keeps fit groups independent of visual scores and rejects synthetic fit qualification', () => {
    const unknown = syntheticMatchResults[0]!;
    expect(designMatchResultErrors({ ...unknown, visualScore: 0 })).toEqual([]);
    expect(designMatchResultErrors({ ...unknown, visualScore: 1 })).toEqual([]);
    expect(unknown.group).toBe('needs-evidence');
    expect(designMatchResultErrors({ ...unknown, group: 'fits-recorded-dimensions' }).length).toBeGreaterThan(0);
    const recordedSynthetic = { ...syntheticMatchResults[1]!, group: 'fits-recorded-dimensions', adjustments: [] };
    expect(designMatchResultErrors(recordedSynthetic)).toContain('Fits-recorded results require reviewed nonsynthetic recorded evidence and no adjustments.');
    expect(designMatchResultErrors({ ...unknown, visualScore: 1.1 })).toContain('Visual score must be between zero and one.');
  });
  it('requires explicit reasons and adjustments rather than an implicit resize', () => {
    const result = syntheticMatchResults[1]!;
    expect(designMatchResultErrors({ ...result, adjustments: [] })).toContain('Changes-required results need explicit adjustments.');
    expect(designMatchResultErrors({ ...result, reasons: [] })).toContain('Explained reasons and explicit evidence are required.');
    expect(designMatchResultErrors({ ...result, version: 3, supplierListingIds: undefined }).length).toBeGreaterThan(0);
  });
  it('rejects a selected case in concept mode', () => {
    expect(designBriefErrors({ ...syntheticSelectedCaseBrief, mode: 'concept' })).toContain('Concept mode cannot include a selected case reference.');
  });
  it('keeps reviewed synthetic measurements in needs-evidence rather than qualifying fit', () => {
    const result = { ...syntheticMatchResults[1]!, group: 'needs-evidence', adjustments: [] };
    expect(designMatchResultErrors(result)).toEqual([]);
    expect(designMatchResultErrors({ ...result, group: 'fits-recorded-dimensions' })).toContain('Fits-recorded results require reviewed nonsynthetic recorded evidence and no adjustments.');
  });
});

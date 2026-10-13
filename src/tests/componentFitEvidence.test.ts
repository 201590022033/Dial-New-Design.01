import { describe, expect, it } from 'vitest';
import { componentFitEvidenceErrors, isReviewedFitMeasurement, type ComponentFitEvidenceV1 } from '@/domain/design-first/componentFitEvidence';
import type { EvidenceField } from '@/domain/design-first/evidence';

const recorded: EvidenceField<number> = { state: 'recorded', value: 31,
  source: { id: 'test-measurement', kind: 'measured-sample', locator: 'Test-only measurement record', capturedAt: '2026-10-12T00:00:00Z' }, review: 'reviewed' };
const document: ComponentFitEvidenceV1 = { schema: 'component-fit-evidence/v1', catalogueItemId: 'test-crystal', measurements: { outerDiameterMm: recorded } };

describe('DF3 exact-component measurement evidence', () => {
  it('retains source-qualified evidence without registering or mutating records', () => {
    const before = JSON.stringify(document);
    expect(componentFitEvidenceErrors(document, 'test-crystal')).toEqual([]);
    expect(isReviewedFitMeasurement(recorded)).toBe(true);
    expect(JSON.stringify(document)).toBe(before);
    expect(componentFitEvidenceErrors(document, 'another-variant')).not.toEqual([]);
  });
  it('rejects invalid dimensions, source metadata and unknown measurement names', () => {
    for (const value of [0, -1, Infinity, '31']) expect(componentFitEvidenceErrors({ ...document, measurements: { outerDiameterMm: { ...recorded, value } } })).not.toEqual([]);
    expect(componentFitEvidenceErrors({ ...document, measurements: { diameterFromPhoto: recorded } })).not.toEqual([]);
    expect(componentFitEvidenceErrors({ ...document, measurements: { outerDiameterMm: { ...recorded, source: null } } })).not.toEqual([]);
    expect(componentFitEvidenceErrors(null)).not.toEqual([]);
    expect(componentFitEvidenceErrors({ ...document, measurements: [] })).not.toEqual([]);
  });
  it('never promotes assumptions, missing measurements, unreviewed or synthetic sources', () => {
    const fields: EvidenceField<number>[] = [
      { state: 'unknown', reason: 'Not supplied' }, { state: 'assumed', value: 31, reason: 'Preview only' },
      { ...recorded, review: 'unreviewed' }, { ...recorded, source: { ...recorded.source, kind: 'synthetic-fixture' } },
    ];
    for (const field of fields) expect(isReviewedFitMeasurement(field)).toBe(false);
    expect(isReviewedFitMeasurement({ ...recorded, source: null } as unknown as EvidenceField<number>)).toBe(false);
  });
});

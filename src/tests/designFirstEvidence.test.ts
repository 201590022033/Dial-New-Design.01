import { describe, expect, it } from 'vitest';
import { evidenceFieldErrors, evidenceSourceErrors, type EvidenceField, type EvidenceSource } from '@/domain/design-first/evidence';
const positiveMm = (value: number) => Number.isFinite(value) && value > 0;
const source: EvidenceSource = { id: 'fixture-only', kind: 'synthetic-fixture', locator: 'fixture://df0/evidence', capturedAt: '2026-10-12T00:00:00Z' };
describe('DF0 evidence contract', () => {
  it('retains unknowns without inventing a dimension or source', () => {
    const unknown: EvidenceField<number> = { state: 'unknown', reason: 'Crystal seat not supplied' };
    expect(evidenceFieldErrors(unknown, positiveMm)).toEqual([]);
    expect(JSON.parse(JSON.stringify(unknown))).toEqual(unknown);
    expect('value' in unknown).toBe(false);
    expect(evidenceFieldErrors({ state: 'unknown', reason: '' }, positiveMm)).not.toEqual([]);
  });
  it('keeps assumptions distinct from sourced values without mutating either', () => {
    const assumed: EvidenceField<number> = { state: 'assumed', value: 40, reason: 'Concept only' };
    const recorded: EvidenceField<number> = { state: 'recorded', value: 40, source, review: 'unreviewed' };
    const before = JSON.stringify([assumed, recorded]);
    expect(evidenceFieldErrors(assumed, positiveMm)).toEqual([]);
    expect(evidenceFieldErrors(recorded, positiveMm)).toEqual([]);
    expect(JSON.stringify([assumed, recorded])).toBe(before);
    expect(recorded.review).toBe('unreviewed');
    expect(recorded.source.kind).toBe('synthetic-fixture');
  });
  it('rejects missing source evidence, invalid values and malformed fields', () => {
    expect(evidenceSourceErrors({ ...source, locator: '', capturedAt: 'missing' })).toHaveLength(2);
    for (const value of [0, -1, Infinity, NaN]) expect(evidenceFieldErrors({ state: 'assumed', value, reason: 'Concept' }, positiveMm)).not.toEqual([]);
    expect(evidenceFieldErrors(undefined as unknown as EvidenceField<number>, positiveMm)).not.toEqual([]);
    expect(evidenceSourceErrors(undefined as unknown as EvidenceSource)).not.toEqual([]);
    expect(evidenceFieldErrors({ state: 'recorded', value: 40, review: 'reviewed' } as EvidenceField<number>, positiveMm)).not.toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { caseConstraintErrors, caseInterfaceMeasurements, type CaseConstraintsV1 } from '@/domain/design-first/caseConstraints';
import { createSyntheticConceptCaseConstraints, createSyntheticIncompleteCaseConstraints, createSyntheticKnownCaseConstraints } from '@/domain/design-first/caseConstraintFixtures';

describe('DF0 case constraint contract', () => {
  it('preserves different interfaces for equally sized cases', () => {
    const first = createSyntheticKnownCaseConstraints(31);
    const second = createSyntheticKnownCaseConstraints(32);
    expect(first.outerDiameterMm).toEqual(second.outerDiameterMm);
    expect(first.catalogueItemId).not.toEqual(second.catalogueItemId);
    expect(first.interfaces.crystalSeatDiameterMm).not.toEqual(second.interfaces.crystalSeatDiameterMm);
    expect(caseConstraintErrors(first)).toEqual([]);
    expect(caseConstraintErrors(second)).toEqual([]);
  });

  it('retains unknown interfaces and inclusion through JSON without deriving dimensions', () => {
    const original = createSyntheticIncompleteCaseConstraints();
    const reloaded = JSON.parse(JSON.stringify(original)) as CaseConstraintsV1;
    expect(reloaded).toEqual(original);
    expect(caseConstraintErrors(reloaded)).toEqual([]);
    for (const key of caseInterfaceMeasurements) {
      expect(reloaded.interfaces[key].state).toBe('unknown');
      expect(reloaded.interfaces[key]).not.toHaveProperty('value');
    }
    expect(reloaded.hardware.crystal.inclusion.state).toBe('unknown');
    expect(reloaded.hardware.crystal.fixedInterface.state).toBe('unknown');
  });

  it('does not mutate input or share mutable fixture fields across factory calls', () => {
    const first = createSyntheticIncompleteCaseConstraints();
    const before = JSON.stringify(first);
    expect(caseConstraintErrors(first)).toEqual([]);
    expect(JSON.stringify(first)).toBe(before);
    const second = createSyntheticIncompleteCaseConstraints();
    expect(first.interfaces.crystalSeatDiameterMm).not.toBe(second.interfaces.crystalSeatDiameterMm);
  });

  it('keeps concept diameter assumed and all case interfaces unknown', () => {
    const concept = createSyntheticConceptCaseConstraints();
    expect(caseConstraintErrors(concept)).toEqual([]);
    expect(concept.outerDiameterMm.state).toBe('assumed');
    expect(Object.values(concept.interfaces).every(field => field.state === 'unknown')).toBe(true);
    expect(concept).not.toHaveProperty('catalogueItemId');
  });

  it('marks recorded fixture evidence conspicuously synthetic and unreviewed', () => {
    const known = createSyntheticKnownCaseConstraints();
    const fields = [known.outerDiameterMm, ...Object.values(known.interfaces), ...Object.values(known.hardware).flatMap(value => [value.inclusion, value.fixedInterface])];
    for (const field of fields) {
      expect(field.state).toBe('recorded');
      if (field.state === 'recorded') {
        expect(field.source.kind).toBe('synthetic-fixture');
        expect(field.review).toBe('unreviewed');
      }
    }
    expect(known).not.toHaveProperty('supplierListingId');
  });

  it.each([null, {}, { ...createSyntheticKnownCaseConstraints(), schema: 'case-constraints/v2' },
    { ...createSyntheticKnownCaseConstraints(), mode: 'automatic' },
    { ...createSyntheticConceptCaseConstraints(), catalogueItemId: 'cat-case' },
    { ...createSyntheticKnownCaseConstraints(), catalogueItemId: undefined },
    { ...createSyntheticKnownCaseConstraints(), catalogueItemId: '', supplierListingId: 'listing-without-item' },
    { ...createSyntheticKnownCaseConstraints(), interfaces: {} },
  ])('rejects unsupported or incomplete contract structure (%#)', value => {
    expect(caseConstraintErrors(value).length).toBeGreaterThan(0);
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid measurements rather than treating %s as missing', value => {
    const fixture = createSyntheticKnownCaseConstraints(value);
    expect(caseConstraintErrors(fixture)).toContain('interfaces.crystalSeatDiameterMm: Evidence value is invalid.');
  });

  it('accepts zero stem datum coordinates while rejecting negative coordinates', () => {
    const fixture = createSyntheticKnownCaseConstraints();
    const zero = { ...fixture, interfaces: { ...fixture.interfaces,
      stemHeightMm: { state: 'assumed', value: 0, reason: 'Synthetic coordinate relative to an explicitly chosen future datum.' } } };
    expect(caseConstraintErrors(zero)).toEqual([]);
    expect(caseConstraintErrors({ ...zero, interfaces: { ...zero.interfaces,
      stemHeightMm: { ...zero.interfaces.stemHeightMm, value: -1 } } })).toContain('interfaces.stemHeightMm: Evidence value is invalid.');
  });

  it('keeps inclusion and fixed interface independent, without issuing fit approval', () => {
    const fixture = createSyntheticKnownCaseConstraints();
    expect(fixture.hardware.crystal.inclusion).toMatchObject({ state: 'recorded', value: 'included' });
    expect(fixture.hardware.dial.inclusion).toMatchObject({ state: 'recorded', value: 'not-included' });
    expect(fixture.hardware.dial.fixedInterface).toMatchObject({ state: 'recorded', value: true });
    expect(fixture).not.toHaveProperty('fitStatus');
  });
});

import type { EvidenceField, EvidenceSource } from './evidence';
import { CASE_CONSTRAINT_SCHEMA, caseHardwareSlots, caseInterfaceMeasurements, type CaseConstraintsV1, type CaseHardwareConstraint } from './caseConstraints';

/** Synthetic contract examples only. These are not catalogue entries or supplier measurements. */
const syntheticSource: EvidenceSource = {
  id: 'synthetic-case-constraint-fixture', kind: 'synthetic-fixture',
  locator: 'test-fixture:synthetic-case-constraints', capturedAt: '2026-10-12T00:00:00Z',
};
const recorded = <T>(value: T): EvidenceField<T> => ({ state: 'recorded', value, source: syntheticSource, review: 'unreviewed' });
const unknown = <T>(): EvidenceField<T> => ({ state: 'unknown', reason: 'Synthetic example deliberately contains no measurement or package evidence.' });
const emptyInterfaces = (): CaseConstraintsV1['interfaces'] => Object.fromEntries(
  caseInterfaceMeasurements.map(key => [key, unknown<number>()]),
) as CaseConstraintsV1['interfaces'];
const emptyHardware = (): CaseConstraintsV1['hardware'] => Object.fromEntries(
  caseHardwareSlots.map(slot => [slot, { inclusion: unknown(), fixedInterface: unknown() }]),
) as Record<typeof caseHardwareSlots[number], CaseHardwareConstraint>;

export function createSyntheticKnownCaseConstraints(crystalSeatDiameterMm = 31): CaseConstraintsV1 {
  return {
    schema: CASE_CONSTRAINT_SCHEMA, mode: 'selected-case',
    catalogueItemId: `synthetic-fixture-only-case-40-seat-${crystalSeatDiameterMm}`,
    outerDiameterMm: recorded(40),
    interfaces: {
      ...emptyInterfaces(), crystalSeatDiameterMm: recorded(crystalSeatDiameterMm),
      crystalSeatDepthMm: recorded(2), dialSeatDiameterMm: recorded(28.5),
      chapterRingSeatDiameterMm: recorded(30), bezelCarrierInnerDiameterMm: recorded(31),
      bezelCarrierOuterDiameterMm: recorded(38), movementCavityDiameterMm: recorded(29),
      movementCavityDepthMm: recorded(6), lugWidthMm: recorded(20),
      stemHeightMm: recorded(2), casebackSeatDiameterMm: recorded(33),
    },
    hardware: Object.fromEntries(caseHardwareSlots.map(slot => [slot, {
      inclusion: recorded(slot === 'crystal' || slot === 'caseback' ? 'included' : slot === 'strap' ? 'optional' : 'not-included'),
      fixedInterface: recorded(slot !== 'strap'),
    }])) as CaseConstraintsV1['hardware'],
  };
}

export function createSyntheticIncompleteCaseConstraints(): CaseConstraintsV1 {
  return { schema: CASE_CONSTRAINT_SCHEMA, mode: 'selected-case', outerDiameterMm: recorded(40),
    catalogueItemId: 'synthetic-fixture-only-case-40-incomplete',
    interfaces: emptyInterfaces(), hardware: emptyHardware() };
}

export function createSyntheticConceptCaseConstraints(): CaseConstraintsV1 {
  return { schema: CASE_CONSTRAINT_SCHEMA, mode: 'concept',
    outerDiameterMm: { state: 'assumed', value: 40, reason: 'Synthetic design concept diameter, not selected physical hardware.' },
    interfaces: emptyInterfaces(), hardware: emptyHardware() };
}

import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { EvidenceValue } from '@/domain/crown';
import { evidenceSourceErrors, type EvidenceField, type EvidenceSource } from './evidence';
import { CASE_CONSTRAINT_SCHEMA, caseConstraintErrors, caseHardwareSlots, caseInterfaceMeasurements, type CaseConstraintsV1, type CaseHardwareConstraint, type CaseInterfaceMeasurement } from './caseConstraints';

export interface SelectedCaseReference {
  readonly part: WatchAssemblyPartInstance;
  readonly item: ComponentCatalogueItem;
}

/** Rendering visibility alone cannot choose between two actual case instances. */
export function findSelectedCase(assembly: WatchAssembly, catalogueItems: readonly ComponentCatalogueItem[]): SelectedCaseReference | undefined {
  const candidates = Object.values(assembly.parts).flatMap(part => {
    const item = catalogueItems.find(candidate => candidate.id === part.catalogueItemId);
    return part.visible && item && ['case', 'midcase'].includes(item.kind) ? [{ part, item }] : [];
  });
  return candidates.length === 1 ? candidates[0] : undefined;
}

const unknown = <T>(reason: string): EvidenceField<T> => ({ state: 'unknown', reason });
const assumedMm = (value: unknown, reason: string): EvidenceField<number> =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? { state: 'assumed', value, reason }
    : unknown('No positive explicit measurement is available for this interface.');

/** Existing evidence carries no review decision; preserve it as unreviewed, never fabricate one. */
function fromLegacyEvidence<T>(field: EvidenceValue<T>, sourceId: string, valid: (value: T) => boolean): EvidenceField<T> {
  if (field.status === 'unknown') return unknown(field.reason || 'Supplier evidence is unavailable.');
  if (!valid(field.value)) return unknown('The stated value is not a valid interface measurement.');
  const evidence = field.evidence;
  const sourceKind = evidence.kind === 'supplier-statement' ? 'supplier-page' : evidence.kind === 'drawing' ? 'manufacturer-drawing' : undefined;
  if (!sourceKind) return { state: 'assumed', value: field.value, reason: `${evidence.kind}: ${evidence.source}. This is not recorded supplier fit evidence.` };
  const source: EvidenceSource = { id: sourceId, kind: sourceKind, locator: evidence.source,
    capturedAt: evidence.retrievedAtIso ?? '', ...(evidence.revision ? { revision: evidence.revision } : {}) };
  return evidenceSourceErrors(source).length === 0
    ? { state: 'recorded', value: field.value, source, review: 'unreviewed' }
    : { state: 'assumed', value: field.value, reason: 'Existing claim lacks complete source capture metadata; no date or review has been invented.' };
}

/** Read-only live projection. No constraints are derived from outer diameter or other parts. */
export function deriveCaseConstraints(assembly: WatchAssembly, mode: 'concept' | 'selected-case', catalogueItems: readonly ComponentCatalogueItem[]): CaseConstraintsV1 {
  const interfaces = Object.fromEntries(caseInterfaceMeasurements.map(key => [key, unknown<number>('Case interface measurement has not been established.')])) as Record<CaseInterfaceMeasurement, EvidenceField<number>>;
  const hardware = Object.fromEntries(caseHardwareSlots.map(slot => [slot, {
    inclusion: unknown('Exact case package contents have not been established.'),
    fixedInterface: unknown('Replaceability and case-owned interfaces need explicit evidence.'),
  }])) as Record<typeof caseHardwareSlots[number], CaseHardwareConstraint>;
  if (mode === 'concept') return { schema: CASE_CONSTRAINT_SCHEMA, mode,
    outerDiameterMm: assumedMm(assembly.globalDimensions.caseDiameterMm, 'Authored concept diameter; no physical case has been selected for this brief.'), interfaces, hardware };
  const selected = findSelectedCase(assembly, catalogueItems);
  if (!selected) throw new Error('Select one identifiable visible case before capturing selected-case constraints; the current case is missing or ambiguous.');
  const { part, item } = selected;
  const outerDiameterMm = assumedMm(part.dimensions.diameterMm, 'Current physical case instance dimension; no field-level source capture or review metadata.');
  if (item.caseConstraints) {
    const recorded = item.caseConstraints;
    if (caseConstraintErrors(recorded).length === 0 && recorded.mode === 'selected-case' && recorded.catalogueItemId === item.id) {
      const projected = structuredClone(recorded);
      return { ...projected,
        outerDiameterMm: recorded.outerDiameterMm.state !== 'unknown' && recorded.outerDiameterMm.value === part.dimensions.diameterMm
          ? projected.outerDiameterMm : outerDiameterMm,
        // The current contract has no stem datum identity; even recorded coordinates are not comparable yet.
        interfaces: { ...projected.interfaces, stemHeightMm: unknown('A shared stem-height datum and qualified coordinate have not been established.') },
      };
    }
    // An invalid or misidentified evidence document must not silently fall back to raw numbers.
    return { schema: CASE_CONSTRAINT_SCHEMA, mode, catalogueItemId: item.id, outerDiameterMm, interfaces, hardware };
  }
  const specs = item.engineeringSpecs?.case;
  const explicit: Partial<Record<CaseInterfaceMeasurement, unknown>> = {
    crystalSeatDiameterMm: specs?.crystalSeatDiameterMm, dialSeatDiameterMm: specs?.dialSeatDiameterMm,
    bezelCarrierInnerDiameterMm: specs?.bezelCarrierInnerMm, bezelCarrierOuterDiameterMm: specs?.bezelCarrierOuterMm,
    movementCavityDiameterMm: specs?.cavityDiameterMm, movementCavityDepthMm: specs?.cavityDepthMm,
  };
  for (const [key, value] of Object.entries(explicit)) {
    interfaces[key as CaseInterfaceMeasurement] = assumedMm(value, 'Explicit catalogue specification without field-level source capture or review metadata.');
  }
  const parametric = part.parametricGeometry?.schema === 'parametric-case/v1' ? part.parametricGeometry : undefined;
  if (parametric) {
    for (const [key, value] of Object.entries({ crystalSeatDiameterMm: parametric.crystalSeatDiameter,
      crystalSeatDepthMm: parametric.crystalAxialSeatDepth, lugWidthMm: parametric.lugPairGap })) {
      interfaces[key as CaseInterfaceMeasurement] = assumedMm(value, 'Authored parametric case geometry; legacy provenance has no field-level capture date or review.');
    }
  }
  const platform = part.offAxisPlatform ?? item.offAxisPlatform;
  if (platform) {
    for (const [key, field] of Object.entries({ crystalSeatDiameterMm: platform.envelope.crystalSeatMm,
      dialSeatDiameterMm: platform.envelope.dialSeatMm, lugWidthMm: platform.envelope.lugWidthMm })) {
      interfaces[key as CaseInterfaceMeasurement] = fromLegacyEvidence(field, `${item.id}:${key}`, value => Number.isFinite(value) && value > 0);
    }
  }
  // Numeric legacy stem heights have no explicit common datum contract and must not be compared.
  interfaces.stemHeightMm = unknown('A shared stem-height datum and qualified coordinate have not been established.');
  for (const [slot, bundle] of [['crown', item.suppliedCrown], ['rotating-bezel', item.suppliedBezel]] as const) {
    if (!bundle) continue;
    if (bundle.evidence.status === 'known' && !['supplier-statement', 'drawing'].includes(bundle.evidence.evidence.kind)) continue;
    const evidence = fromLegacyEvidence(bundle.evidence, `${item.id}:included:${slot}`, value => typeof value === 'string' && value.trim().length > 0);
    hardware[slot] = { ...hardware[slot], inclusion: evidence.state === 'unknown' ? evidence : { ...evidence, value: 'included' } };
  }
  return { schema: CASE_CONSTRAINT_SCHEMA, mode, catalogueItemId: item.id,
    outerDiameterMm, interfaces, hardware };
}

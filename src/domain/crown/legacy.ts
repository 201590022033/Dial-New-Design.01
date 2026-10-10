import { PARAMETRIC_CROWN_V1, validateParametricCrownV1, type ParametricCrownV1 } from '../geometry/parametric/crown';
import { CROWN_SPEC_V1, type CrownSpecificationV1, type EvidenceValue } from './types';
import { assertCrownSpecification } from './validation';

/** Structural input avoids a dependency cycle with assembly types. All extra fields survive. */
export interface LegacyCrownInput {
  material: string; color: string; texture: string;
  instanceId?: string;
  dimensions?: { diameterMm: number; thicknessMm: number };
  parametricGeometry?: unknown;
}
export interface LegacyCrownMigration<T> { specification: CrownSpecificationV1; original: T }
export const unknownCrownEvidence = <T>(reason = 'Not established by legacy crown data'): EvidenceValue<T> => ({ status: 'unknown', reason });
const legacy = <T>(value: T, source: string): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'legacy-preserved', source } });

/** Explicit, reversible adapter. Loading a project must never call this automatically. */
export const migrateLegacyCrown = <T extends LegacyCrownInput>(original: T, axisId = 'crown-main'): LegacyCrownMigration<T> => {
  const snapshot = structuredClone(original);
  const geometry = original.parametricGeometry;
  let p: ParametricCrownV1 | undefined;
  if (geometry && typeof geometry === 'object' && 'schema' in geometry && geometry.schema === PARAMETRIC_CROWN_V1) {
    const result = validateParametricCrownV1(geometry);
    if (result.status === 'invalid') throw new Error(`Cannot migrate invalid legacy crown: ${result.errors.join('; ')}`);
    p = geometry as ParametricCrownV1;
  }
  const u = unknownCrownEvidence;
  const dimension = (value: unknown, source: string): EvidenceValue<number> => typeof value === 'number' ? legacy(value, source) : u();
  const thread = () => ({ outerDiameterMm: u<number>(), pitchMm: u<number>(), supplierTapLabel: u<string>() });
  const specification: CrownSpecificationV1 = {
    schema: CROWN_SPEC_V1, axisId,
    shape: u(), grip: u(),
    coreDiameterMm: dimension(p ? p.headDiameterMm : original.dimensions?.diameterMm, p ? 'parametric-crown/v1 headDiameterMm is core diameter' : 'Legacy nominal diameter; presentation only'),
    maximumOuterDiameterMm: p && typeof p.headDiameterMm === 'number' && typeof p.gripDepthMm === 'number'
      ? legacy(p.headDiameterMm + 2 * p.gripDepthMm, 'parametric-crown/v1 core diameter plus twice radial gripDepthMm') : u('Maximum grip envelope not established'),
    headLengthMm: dimension(p ? p.headLengthMm : original.dimensions?.thicknessMm, 'Legacy axial head length; presentation only'),
    closure: legacy('unspecified', 'Legacy data has no established closure'),
    finish: { mode: 'override', material: original.material, color: original.color, texture: original.texture },
    protection: u(),
    ownership: { operatingHead: 'crown', tube: 'case', boss: 'case', fixedGuards: 'case' },
    interfaces: {
      movementStem: { movementId: u(), revision: u(), stemReference: u(), thread: thread() },
      // The old socket was a blind visual bore. Its dimensions and legacy thread field
      // remain in original; neither establishes a physical crown socket or stem thread.
      crownSocket: { thread: thread(), boreDiameterMm: u(), engagementLengthMm: u() },
      caseTubeEngagement: { caseFamily: u(), thread: thread(), engagementLengthMm: u(), gasketEnvelopeMm: u() },
      capHolder: { mechanismId: u(), thread: thread(), clearanceMm: u() },
    },
    installation: { movementRotationDeg: u(), stemHeightMm: u(), spacerId: u(), dialFeetInterface: u(), dialRotationDeg: u(), calendarApertureDeg: u(), dateWheelOrientationDeg: u(), loading: u() },
  };
  assertCrownSpecification(specification);
  return { specification, original: snapshot };
};
/** Restore identities, anchors, procurement and old geometry exactly from the preserved snapshot. */
export const restoreLegacyCrown = <T>(migration: Pick<LegacyCrownMigration<T>, 'original'>): T => structuredClone(migration.original);

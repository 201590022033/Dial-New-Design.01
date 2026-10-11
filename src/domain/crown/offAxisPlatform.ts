import { z } from 'zod';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { CompatibilityCheckResult } from '@/domain/compatibility/compatibilityTypes';
import { evidence } from './validation';

const dimension = evidence(z.number().finite().positive());
const text = evidence(z.string().trim().min(1));
const orientation = evidence(z.number().finite());
export const offAxisPlatformSchema = z.object({
  schema: z.literal('off-axis-platform/v1'), id: z.string().min(1), caseCatalogueId: z.string().min(1),
  sourceUrl: z.url(), variantId: z.string().min(1), sku: z.string().min(1), identityStatus: z.literal('requires-confirmation'),
  physicalFit: z.literal('unqualified'),
  presentationMovementIds: z.array(z.string().min(1)).min(1),
  envelope: z.object({ shroudDiameterMm: dimension, midcaseDiameterMm: dimension, bezelOuterMm: dimension, bezelInnerMm: dimension, dialSeatMm: dimension, crystalSeatMm: dimension, casebackDiameterMm: dimension, lugWidthMm: dimension, lugToLugMm: dimension }),
  supplierMovements: evidence(z.array(z.string().min(1)).min(1)),
  dialRangeMm: evidence(z.tuple([z.number().positive(), z.number().positive()]).refine(([min, max]) => min <= max)),
  installation: z.object({ movementRotationDeg: orientation, dialRotationDeg: orientation, calendarApertureDeg: orientation, dateWheelOrientationDeg: orientation, stemHeightMm: orientation, spacerId: text, dialFeetInterface: text, loading: evidence(z.enum(['front', 'rear'])) }),
  notes: z.string().min(1)
});
export type OffAxisCasePlatform = z.infer<typeof offAxisPlatformSchema>;
export function assertOffAxisPlatform(value: unknown): asserts value is OffAxisCasePlatform { offAxisPlatformSchema.parse(value); }

/** Evidence checks qualify installation separately from a coherent picture. */
export const checkOffAxisPlatform = (assembly: WatchAssembly): CompatibilityCheckResult[] => {
  const part = Object.values(assembly.parts).find(p => p.offAxisPlatform);
  if (!part?.offAxisPlatform) return [];
  const platform = part.offAxisPlatform;
  const checks: CompatibilityCheckResult[] = [];
  const add = (status: 'red' | 'unknown', summary: string, ids: string[] = []) => checks.push({ status, code: status === 'red' ? 'OFF_AXIS_PLATFORM_MISMATCH' : 'OFF_AXIS_INSTALLATION_UNKNOWN', category: 'off-axis-platform', summary, affectedPartIds: [part.instanceId, ...ids] });
  if (!platform.presentationMovementIds.includes(assembly.metadata.movement.toLowerCase())) add('red', `This provisional model does not support ${assembly.metadata.movement}. Its software movement scope is not a supplier fit qualification.`);
  if (platform.supplierMovements.status === 'known' && !platform.supplierMovements.value.includes(assembly.metadata.movement.toLowerCase())) add('red', `Supplier does not identify ${assembly.metadata.movement} for this exact off-axis case. NH34/NH35/NH36 installations are separate evidence gates.`);
  const strap = assembly.parts['inst-strap-integration'];
  if (strap?.visible && platform.envelope.lugWidthMm.status === 'known' && strap.dimensions.widthMm !== platform.envelope.lugWidthMm.value) add('red', `This case requires ${platform.envelope.lugWidthMm.value} mm strap width; select a matching strap before Apply.`, [strap.instanceId]);
  const dial = assembly.parts['inst-dial-blank'];
  if (dial && platform.dialRangeMm.status === 'known') {
    const [min, max] = platform.dialRangeMm.value;
    if (dial.dimensions.diameterMm < min || dial.dimensions.diameterMm > max) add('red', `Supplier dial range is ${min}-${max} mm; current dial is outside it.`, [dial.instanceId]);
  }
  add('unknown', 'Off-axis presentation only: exact stem height/spacer, movement installation, dial feet, calendar/date wheel, tube, crystal, bezel and caseback interfaces remain unqualified. The dial is not rotated to conceal missing installation evidence.');
  return checks;
};

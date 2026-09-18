import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import type { ParametricCaseV1, ParametricHandSetV1, DimensionMm } from './types';
import type { ParametricCrownV1 } from './crown';

export interface ReferenceFitIssue {
  code: 'CROWN_LUG_OVERLAP' | 'HAND_BORE_MISMATCH' | 'CROWN_ENGAGEMENT_UNKNOWN' | 'STACK_CLEARANCE_UNKNOWN' | 'STEM_INTERFACE_UNKNOWN';
  status: 'conflict' | 'unknown';
  detail: string;
}
const measured = (n: DimensionMm | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

/** Checks only what the supplied reference geometry can establish. No invented fit tolerances. */
export const assessReference3dFit = (assembly: WatchAssembly): ReferenceFitIssue[] => {
  const c = assembly.parts['inst-midcase']?.parametricGeometry;
  const crown = assembly.parts['inst-crown']?.parametricGeometry;
  const hands = assembly.parts['inst-hour-hand']?.parametricGeometry;
  if (c?.schema !== 'parametric-case/v1' || crown?.schema !== 'parametric-crown/v1' || hands?.schema !== 'parametric-hand-set/v1') return [];
  const caseSpec: ParametricCaseV1 = c;
  const crownSpec: ParametricCrownV1 = crown;
  const handSet: ParametricHandSetV1 = hands;
  const issues: ReferenceFitIssue[] = [];
  const gap = crownSpec.attachment.axialGapMm;
  if ([caseSpec.caseDiameter, caseSpec.lugCaseOverlap, caseSpec.lugToLug, caseSpec.crownTubeEmbed, caseSpec.crownTubeLength, crownSpec.headLengthMm, gap].every(measured)) {
    const diameter = caseSpec.caseDiameter as number;
    const tubeEnd = diameter / 2 - (caseSpec.crownTubeEmbed as number) + (caseSpec.crownTubeLength as number);
    const rear = tubeEnd + (gap as number);
    const lugRoot = diameter / 2 - (caseSpec.lugCaseOverlap as number);
    const lugTip = (caseSpec.lugToLug as number) / 2;
    if (rear < lugTip && rear + (crownSpec.headLengthMm as number) > lugRoot && measured(caseSpec.lugTipWidth) && caseSpec.lugTipWidth > 0) {
      issues.push({ code: 'CROWN_LUG_OVERLAP', status: 'conflict', detail: `The +X lug occupies X=${lugRoot.toFixed(2)}–${lugTip.toFixed(2)} mm while the crown head occupies X=${rear.toFixed(2)}–${(rear + (crownSpec.headLengthMm as number)).toFixed(2)} mm on the same axis.` });
    }
    if (rear >= tubeEnd) issues.push({ code: 'CROWN_ENGAGEMENT_UNKNOWN', status: 'unknown', detail: 'The crown rear face meets or clears the tube end; no insertion depth or sealed mechanical engagement is specified.' });
  }
  const movement = movementLibrary.find((item) => item.id === assembly.metadata.movement);
  if (movement) {
    for (const [kind, hand, key] of [['hour', handSet.hour, 'hour'], ['minute', handSet.minute, 'minute'], ['seconds', handSet.seconds, 'second']] as const) {
      if (!hand) continue;
      const bore = hand.hub.pinionHoleDiameter;
      const arbor = movement.handSizesMm[key];
      if (measured(bore) && bore !== arbor) {
        issues.push({ code: 'HAND_BORE_MISMATCH', status: 'conflict', detail: `${kind} hand fixture bore ${bore.toFixed(2)} mm differs from the ${movement.name} template arbor ${arbor.toFixed(2)} mm.` });
      }
    }
  } else issues.push({ code: 'HAND_BORE_MISMATCH', status: 'unknown', detail: `Movement ${assembly.metadata.movement} has no template for bore comparison.` });
  issues.push({ code: 'STACK_CLEARANCE_UNKNOWN', status: 'unknown', detail: 'Dial seat, hand stack and crystal underside use provisional visual frames; axial clearance is unverified.' });
  issues.push({ code: 'STEM_INTERFACE_UNKNOWN', status: 'unknown', detail: 'Crown stem/thread, gasket, tube fit and retention have not been measured or verified.' });
  return issues;
};

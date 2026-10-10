import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { CompatibilityCheckResult } from '@/domain/compatibility/compatibilityTypes';
import type { CrownThreadV1, EvidenceValue } from './types';
import { validateCrownSpecification } from './validation';
import { crownSpecificationForPart, isCrownPart } from './selection';

/** Expected mating data, not the case's removable operating head. */
export interface CrownPlatformInterface {
  closure?: EvidenceValue<'push-pull' | 'screw-down'>;
  caseFamily: EvidenceValue<string>;
  tubeThread: CrownThreadV1;
  stemThread: CrownThreadV1;
  stemReference: EvidenceValue<string>;
  stemHeightMm: EvidenceValue<number>;
  engagementLengthMm: EvidenceValue<number>;
  gasketEnvelopeMm: EvidenceValue<number>;
  matchedAssemblyId?: string;
}

export const checkCrownCompatibility = (assembly: WatchAssembly): CompatibilityCheckResult[] => {
  const crown = Object.values(assembly.parts).find(p => p.visible && isCrownPart(p));
  if (!crown) return [];
  const authored = crown.crownSpecification ?? crown.customProperties?.detachedCrownSpecification;
  const spec = crownSpecificationForPart(crown);
  const platform = assembly.parts['inst-midcase'] && getCatalogueItem(assembly.parts['inst-midcase'].catalogueItemId)?.crownInterface;
  const result = (status: 'red' | 'unknown', summary: string): CompatibilityCheckResult => ({ status, code: status === 'red' ? 'CROWN_INTERFACE_MISMATCH' : 'CROWN_INTERFACE_UNKNOWN', category: 'crown-interface', summary, affectedPartIds: [crown.instanceId, 'inst-midcase'] });
  if (authored && validateCrownSpecification(authored).status === 'invalid') return [result('red', 'Invalid crown specification cannot establish a valid replacement.')];
  if (!spec) return [result('unknown', 'Crown stem/socket, case tube, gaskets and installation are unqualified.')];
  if (validateCrownSpecification(spec).status === 'invalid') return [result('red', 'Invalid crown specification cannot establish a valid replacement.')];
  const contradictions: string[] = [];
  const missing: string[] = [];
  const compare = <T extends string | number>(label: string, a?: EvidenceValue<T>, b?: EvidenceValue<T>) => {
    if (a?.status !== 'known' || b?.status !== 'known' || a.evidence.kind === 'visual-approximation' || b.evidence.kind === 'visual-approximation') { missing.push(label); return; }
    if (a.value !== b.value) contradictions.push(label);
  };
  compare('case/tube family', spec.interfaces.caseTubeEngagement.caseFamily, platform?.caseFamily);
  compare('tube thread diameter', spec.interfaces.caseTubeEngagement.thread.outerDiameterMm, platform?.tubeThread.outerDiameterMm);
  compare('tube thread pitch', spec.interfaces.caseTubeEngagement.thread.pitchMm, platform?.tubeThread.pitchMm);
  compare('stem/socket thread diameter', spec.interfaces.crownSocket.thread.outerDiameterMm, platform?.stemThread.outerDiameterMm);
  compare('stem/socket thread pitch', spec.interfaces.crownSocket.thread.pitchMm, platform?.stemThread.pitchMm);
  compare('movement stem reference', spec.interfaces.movementStem.stemReference, platform?.stemReference);
  compare('stem height', spec.installation.stemHeightMm, platform?.stemHeightMm);
  compare('tube engagement length', spec.interfaces.caseTubeEngagement.engagementLengthMm, platform?.engagementLengthMm);
  compare('gasket envelope', spec.interfaces.caseTubeEngagement.gasketEnvelopeMm, platform?.gasketEnvelopeMm);
  if (spec.interfaces.movementStem.movementId.status !== 'known') missing.push('movement identity');
  else if (spec.interfaces.movementStem.movementId.value.toLowerCase() !== assembly.metadata.movement.toLowerCase()) contradictions.push('movement identity');
  if (spec.closure.status !== 'known' || spec.closure.value === 'unspecified') missing.push('closure');
  else compare('closure mechanism', spec.closure, platform?.closure);
  if (spec.ownership.matchedAssemblyId && platform?.matchedAssemblyId && spec.ownership.matchedAssemblyId !== platform.matchedAssemblyId) contradictions.push('matched cap/lever assembly');
  else if (spec.ownership.matchedAssemblyId && !platform?.matchedAssemblyId) missing.push('matched cap/lever assembly');
  if (contradictions.length) return [result('red', `Crown conflicts with selected platform: ${contradictions.join(', ')}.`)];
  // Nominal agreement alone cannot certify tolerances, sealing or assembly testing.
  return [result('unknown', missing.length ? `Crown fit unknown: ${missing.join(', ')}. Concept preview only; confirm before procurement.` : 'Nominal crown interfaces agree; tolerances, clearances and sealing still require measurement/testing.')];
};

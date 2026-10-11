import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { CrownSpecificationV1 } from './types';
import { crownSpecificationForPart, isCrownPart, withCrownDefault } from './selection';
import { migrateLegacyCrown } from './legacy';
import { presentationEvidence } from './catalogue';

export interface CrownCapConcept {
  schema: 'crown-cap-concept/v1';
  state: 'open' | 'closed';
  /** Presentation clearance, not measured mating clearance. */
  clearanceMm: number;
  wallMm: number;
}
export type CrownEdit =
  | { type: 'finish'; finish: CrownSpecificationV1['finish'] }
  | { type: 'closure'; closure: 'unspecified' | 'push-pull' | 'screw-down' }
  | { type: 'cap-concept'; concept: CrownCapConcept | null }
  | { type: 'restore-default' };

export const validCapConcept = (v: unknown): v is CrownCapConcept => {
  if (!v || typeof v !== 'object') return false;
  const c = v as CrownCapConcept;
  return c.schema === 'crown-cap-concept/v1' && ['open', 'closed'].includes(c.state)
    && Number.isFinite(c.clearanceMm) && c.clearanceMm >= .5 && c.clearanceMm <= 3
    && Number.isFinite(c.wallMm) && c.wallMm >= .3 && c.wallMm <= 1.5;
};

export const crownEditError = (assembly: WatchAssembly, id: string, edit: CrownEdit): string | undefined => {
  if (!edit || !['finish', 'closure', 'cap-concept', 'restore-default'].includes(edit.type)) return 'Invalid crown edit intent.';
  const part = assembly.parts[id];
  if (!part || !isCrownPart(part)) return 'Crown controls require an operating crown.';
  if (part.locked) return 'Unlock the crown before editing.';
  if (edit.type === 'finish' && (!edit.finish || typeof edit.finish !== 'object')) return 'Invalid crown finish.';
  if (edit.type === 'cap-concept' && edit.concept !== null && !validCapConcept(edit.concept)) return 'Invalid cap concept envelope.';
  if (edit.type === 'closure' && !['unspecified', 'push-pull', 'screw-down'].includes(edit.closure)) return 'Invalid closure option.';
  if (edit.type === 'finish' && edit.finish.mode !== 'inherit-case' && (edit.finish.mode !== 'override' || !/^#[0-9a-f]{6}$/i.test(edit.finish.color) || !['steel', 'rose-gold', 'black-pvd'].includes(edit.finish.material) || !['polished', 'brushed', 'matte'].includes(edit.finish.texture))) return 'Invalid crown finish.';
  return undefined;
};

/** Narrow, replayable intent: callers never commit a stale full document. */
export const applyCrownEdit = (assembly: WatchAssembly, id: string, edit: CrownEdit): WatchAssembly => {
  const error = crownEditError(assembly, id, edit);
  if (error) throw new Error(error);
  const next = structuredClone(assembly), part = next.parts[id]!;
  if (edit.type === 'restore-default') {
    if (next.designConfig) next.designConfig.crownChoice = undefined;
    part.catalogueItemId = 'cat-crown'; part.visual = undefined; part.parametricGeometry = undefined; part.crownSpecification = undefined;
    part.customProperties = undefined; part.crownCapConcept = undefined;
    part.material = 'steel'; part.texture = 'knurled'; part.color = '#E2E8F0';
    part.dimensions = { ...part.dimensions, diameterMm: 6.5, thicknessMm: 3.5 };
    return withCrownDefault(next);
  }
  if (edit.type === 'cap-concept') {
    part.crownCapConcept = edit.concept ? structuredClone(edit.concept) : undefined;
  } else {
    const spec = structuredClone(crownSpecificationForPart(part) ?? migrateLegacyCrown(part).specification);
    if (edit.type === 'finish') spec.finish = structuredClone(edit.finish);
    if (edit.type === 'closure') {
      // An illustrative mechanism choice cannot replace measured interfaces.
      spec.closure = presentationEvidence(edit.closure);
    }
    if (part.crownSpecification) part.crownSpecification = spec;
    else part.customProperties = { ...part.customProperties, detachedCrownSpecification: spec };
  }
  next.designConfig = { ...next.designConfig, crownChoice: { ...next.designConfig?.crownChoice, schema: 'crown-choice/v1', selected: { crownInstanceId: id, source: 'explicit-user' } } };
  return next;
};

export const crownEditCandidate = (assembly: WatchAssembly, id: string, edit: CrownEdit): ComponentCatalogueItem => {
  const part = assembly.parts[id]!;
  return { id: part.catalogueItemId, kind: 'crown', category: 'external', displayName: `Crown ${edit.type}`, crownEdit: edit,
    defaultMaterial: part.material, defaultTexture: part.texture, linkedBandKind: null,
    nominalDimensions: { ...part.dimensions }, manufacturing: { processProfile: 'cnc', minimumFeatureMm: .1, minimumGapMm: .1, minimumStrokeWidthMm: .1, recommendations: [] },
    softStyles: [], status: 'draft', exportEnabled: false, metadata: { tags: ['concept'], revision: '1', notes: 'Presentation only; no hardware certification' } };
};

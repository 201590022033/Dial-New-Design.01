import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { DesignBriefV1, DesignDimension } from './designBrief';
import { designBriefErrors } from './designBrief';
import type { DesignPartSlot, EvidenceField } from './evidence';
import { findSelectedCase } from './caseConstraintAdapter';
import { assertDesignIntent, readDesignIntent, type DesignIntentV1 } from './designIntent';

const canonicalContent = (value: unknown): string => JSON.stringify(value, (_key, entry: unknown) => {
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) return Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  return entry;
});

/** Content identity, not a security signature. DF4 must also revalidate current fit on Apply.
 * Creation/update timestamps do not establish freshness. Explicit local intent overrides saved intent.
 * Catalogue evidence is not copied into the brief; DF4 must resolve its current catalogue records.
 */
export function designAssemblyIdentity(assembly: WatchAssembly, intent: DesignIntentV1 = readDesignIntent(assembly), items: readonly ComponentCatalogueItem[] = []): string {
  assertDesignIntent(intent);
  const { createdAtIso: _created, updatedAtIso: _updated, ...metadata } = assembly.metadata;
  void _created; void _updated;
  const content = canonicalContent({ assembly: { ...assembly, metadata, designConfig: { ...assembly.designConfig, designIntent: intent } }, catalogue: [...items].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) });
  // Four independent integer lanes produce a compact deterministic document-change token.
  const lanes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let index = 0; index < content.length; index++) {
    for (let lane = 0; lane < lanes.length; lane++) lanes[lane] = Math.imul(lanes[lane]! ^ content.charCodeAt(index), 0x01000193 + lane * 2) >>> 0;
  }
  return `df2-v1:${content.length}:${lanes.map(lane => lane.toString(16).padStart(8, '0')).join('')}`;
}

export function designPartSlot(item: ComponentCatalogueItem): DesignPartSlot | undefined {
  const kinds: Record<string, DesignPartSlot> = {
    case: 'case', midcase: 'case', 'dial-blank': 'dial', dial: 'dial',
    crystal: 'crystal', 'flat-sapphire': 'crystal', 'domed-sapphire': 'crystal', 'double-domed-sapphire': 'crystal',
    caseback: 'caseback', crown: 'crown', 'chapter-ring': 'chapter-ring', 'inner-bezel': 'inner-bezel',
    'rotating-bezel': 'rotating-bezel', strap: 'strap', bracelet: 'strap'
  };
  return kinds[item.kind] ?? (item.category === 'hands' ? 'hands' : item.visual?.category === 'strap' ? 'strap' : undefined);
}

/** Read-only creative snapshot; assumed authored values are never supplier measurements. */
export function captureDesignBrief(
  assembly: WatchAssembly, targetInstanceId: string, items: readonly ComponentCatalogueItem[],
  intent: DesignIntentV1 = readDesignIntent(assembly)
): DesignBriefV1 {
  assertDesignIntent(intent);
  const target = assembly.parts[targetInstanceId];
  if (!target) throw new Error('Choose an existing component before capturing a design brief.');
  const item = items.find(candidate => candidate.id === target.catalogueItemId);
  if (!item) throw new Error('This component has no current catalogue record.');
  const slot = designPartSlot(item);
  if (!slot) throw new Error('This component is not yet supported for finding physical parts. Choose a dial, hands, bezel, crystal, case, crown or strap.');
  const selectedCase = intent.mode === 'selected-case' ? findSelectedCase(assembly, [...items]) : undefined;
  if (intent.mode === 'selected-case' && !selectedCase) throw new Error('Selected-case mode needs one visible case with a current catalogue record. Choose a case or use concept mode.');
  const desiredDimensions: Partial<Record<DesignDimension, EvidenceField<number>>> = {};
  const dimensionPaths: string[] = [];
  for (const dimension of ['diameterMm', 'widthMm', 'thicknessMm'] as const) {
    const value = target.dimensions[dimension];
    desiredDimensions[dimension] = Number.isFinite(value) && value > 0
      ? { state: 'assumed', value, reason: 'Current authored design dimension; not supplier fit evidence.' }
      : { state: 'unknown', reason: 'No positive dimension has been authored for this component.' };
    dimensionPaths.push(`target.dimensions.${dimension}`);
  }
  const stylePreferences: Record<string, string> = {};
  for (const [key, value] of Object.entries({ colour: target.color, material: target.material, texture: target.texture, handStyle: item.visual?.handStyle, bezelProfile: item.visual?.bezelProfile, styleNotes: intent.styleNotes })) {
    if (typeof value === 'string' && value.trim()) stylePreferences[key] = value;
  }
  // Scoped appearance keys are intent paths. DF4 resolves them to canonical fields;
  // they must never be executed through arbitrary dotted-path assignment.
  const appearancePaths = ['color', 'material', 'texture', 'style'].map(key => `target.appearance.${key}`);
  const preserve = [...(intent.preserveDimensions ? dimensionPaths : []), ...(intent.preserveAppearance ? appearancePaths : [])];
  const allowChanges = [...(!intent.preserveDimensions ? dimensionPaths : []), ...(!intent.preserveAppearance ? appearancePaths : [])];
  const brief: DesignBriefV1 = {
    version: 1, mode: intent.mode,
    assembly: { id: assembly.metadata.id, revision: assembly.metadata.revision, identityToken: designAssemblyIdentity(assembly, intent, items) },
    target: { slot, partInstanceId: target.instanceId, catalogueItemId: target.catalogueItemId },
    ...(selectedCase ? { selectedCase: { partInstanceId: selectedCase.part.instanceId, catalogueItemId: selectedCase.item.id } } : {}),
    desiredDimensions, stylePreferences,
    permissions: { preserve, allowChanges, lockedPartIds: Object.values(assembly.parts).filter(part => part.locked).map(part => part.instanceId).sort() }
  };
  const errors = designBriefErrors(brief, assembly);
  if (errors.length) throw new Error(`Cannot capture design brief: ${errors.join(' ')}`);
  return brief;
}

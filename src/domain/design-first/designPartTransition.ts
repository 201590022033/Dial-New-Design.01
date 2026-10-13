import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import type { DesignBriefV1, DesignMatchResultV1 } from './designBrief';
import type { DesignIntentV1 } from './designIntent';
import { searchDesignParts } from './searchDesignParts';

export interface DesignPartChange {
  readonly partInstanceId?: string;
  /** Part-relative property for component changes; full document path for other changes. */
  readonly property: string;
  readonly before: unknown;
  readonly after: unknown;
}
export interface PrepareDesignPartTransitionOptions {
  readonly assembly: WatchAssembly;
  readonly brief: DesignBriefV1;
  readonly candidateId: string;
  readonly items: readonly ComponentCatalogueItem[];
  readonly supplierListings: readonly SupplierListing[];
  readonly intent: DesignIntentV1;
  readonly lockedPartIds?: ReadonlySet<string>;
  readonly lockedStyles?: Readonly<Record<string, boolean>>;
}
export interface DesignPartTransition {
  readonly assembly: WatchAssembly;
  readonly result: DesignMatchResultV1;
  readonly changes: readonly DesignPartChange[];
  readonly changedPartIds: readonly string[];
}

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value: unknown, index) => same(value, b[index]));
  if (!record(a) || !record(b)) return false;
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.every(key => same(a[key], b[key]));
};
function diff(before: unknown, after: unknown, path: readonly string[] = []): DesignPartChange[] {
  if (same(before, after)) return [];
  if (path.at(-1) === 'catalogueSelection') return [{ partInstanceId: path[1], property: path.slice(2).join('.'), before: structuredClone(before), after: structuredClone(after) }];
  if ((record(before) || before === undefined) && (record(after) || after === undefined)) {
    const old = record(before) ? before : {}, next = record(after) ? after : {};
    const keys = [...new Set([...Object.keys(old), ...Object.keys(next)])].sort();
    if (keys.length) return keys.flatMap(key => diff(old[key], next[key], [...path, key]));
  }
  return [{ ...(path[0] === 'parts' && path[1] ? { partInstanceId: path[1] } : {}),
    property: (path[0] === 'parts' ? path.slice(2) : path).join('.'),
    before: structuredClone(before), after: structuredClone(after) }];
}
const appearanceKind = (property: string): string | undefined => {
  if (property === 'color') return 'color';
  if (property === 'material') return 'material';
  if (property === 'texture') return 'texture';
  if (property.startsWith('visual.') || property === 'customProperties.visualHandStyle' || property === 'customProperties.visualBezelProfile'
    || property.startsWith('crownSpecification.shape') || property.startsWith('crownSpecification.grip') || property.startsWith('crownCapConcept')) return 'style';
  return undefined;
};

/** Rebuilds from current documents; never commits or upgrades missing evidence into fit approval. */
export function prepareDesignPartTransition(options: PrepareDesignPartTransitionOptions): DesignPartTransition {
  const { assembly, brief, candidateId, items, supplierListings, intent, lockedPartIds, lockedStyles } = options;
  const candidate = items.find(item => item.id === candidateId);
  if (!candidate) throw new Error('This candidate is no longer in the current catalogue. Search again.');
  if (candidate.researchOnly) throw new Error('Discovery records cannot replace physical design components.');
  if (candidate.crownEdit) throw new Error('Crown editing commands are not physical replacement components.');
  // Search validates full content/evidence identity, captured preferences and candidate slot.
  const result = searchDesignParts({ assembly, brief, items, supplierListings, intent }).find(match => match.catalogueItemId === candidateId);
  if (!result) throw new Error('This candidate belongs to a different component slot.');
  if (result.group === 'incompatible') throw new Error(`Cannot preview this replacement: ${result.reasons.map(reason => reason.explanation).join(' ')}`);
  if (result.reasons.some(reason => reason.code.startsWith('CONFLICTING_'))) throw new Error('Candidate dimensions contain conflicting product evidence. Reconcile the catalogue before previewing a replacement.');
  const targetId = brief.target.partInstanceId;
  if (assembly.parts[targetId]?.locked || lockedPartIds?.has(targetId)) throw new Error('Unlock this component before replacing it.');
  const next = applyCatalogueVisualSelection(assembly, targetId, candidate);
  // Width on a solid circular plate is a legacy display parameter, not its supplier mating diameter.
  // Retain authored display geometry when this publication explicitly has no width measurement.
  if (['dial', 'crystal'].includes(brief.target.slot) && candidate.nominalDimensions.widthMm === 0 && candidate.fitEvidence?.measurements.widthMm?.state === 'unknown') {
    next.parts[targetId]!.dimensions.widthMm = assembly.parts[targetId]!.dimensions.widthMm;
  }
  for (const [id, part] of Object.entries(next.parts)) {
    const previous = assembly.parts[id];
    if (!previous) continue;
    for (const dimension of ['diameterMm', 'thicknessMm', 'widthMm'] as const) {
      if (previous.dimensions[dimension] > 0 && !(Number.isFinite(part.dimensions[dimension]) && part.dimensions[dimension] > 0)) {
        throw new Error(`Replacement would erase the recorded ${dimension} of ${previous.name} with a missing or zero catalogue value.`);
      }
    }
  }
  const changes = diff(assembly, next);
  const changedPartIds = [...new Set(changes.flatMap(change => change.partInstanceId ? [change.partInstanceId] : []))].sort();
  const permitted = (path: string) => !brief.permissions.preserve.includes(path) && brief.permissions.allowChanges.includes(path);
  for (const change of changes) {
    const id = change.partInstanceId;
    if (id && (assembly.parts[id]?.locked || brief.permissions.lockedPartIds.includes(id) || lockedPartIds?.has(id))) {
      throw new Error(`Replacement also changes locked component ${assembly.parts[id]?.name ?? id}.`);
    }
    const appearance = id ? appearanceKind(change.property) : undefined;
    if (id && appearance && lockedStyles?.[id]) throw new Error(`Replacement changes the locked style of ${assembly.parts[id]?.name ?? id}.`);
  }
  for (const change of changes) {
    const { partInstanceId: id, property } = change;
    if (id) {
      if (id !== targetId) throw new Error(`This replacement also changes ${assembly.parts[id]?.name ?? id}; approval currently covers only the selected component.`);
      if (property.startsWith('dimensions.')) {
        if (!['dimensions.diameterMm', 'dimensions.widthMm', 'dimensions.thicknessMm'].includes(property) || !permitted(`target.${property}`)) {
          throw new Error(`Replacement changes a preserved or unapproved dimension: ${property}.`);
        }
        continue;
      }
      const appearance = appearanceKind(property);
      if (appearance) {
        // Visual asset/category association is necessary metadata, but authored style preservation remains binding.
        if (!permitted(`target.appearance.${appearance}`)) throw new Error(`Replacement changes a preserved or unapproved ${appearance} choice.`);
        continue;
      }
      const association = ['catalogueItemId', 'name', 'parametricGeometry', 'geometryProvenance', 'crownSpecification', 'offAxisPlatform', 'crownAxes'];
      const safeCustom = ['customProperties.catalogueSelection', 'customProperties.engineeringSpecs', 'customProperties.visualCrownAngleDeg', 'customProperties.detachedCrownSpecification'];
      if (association.some(key => property === key || property.startsWith(`${key}.`)) || safeCustom.some(key => property === key || property.startsWith(`${key}.`))) continue;
      throw new Error(`Replacement changes an unapproved component setting: ${property}.`);
    }
    const referencePrefix = 'designConfig.visualReferenceConfig.componentAssetOverrides.';
    if (candidate.visual && property === `${referencePrefix}${candidate.visual.category}`) {
      if (!permitted('target.appearance.style')) throw new Error('Replacement changes a preserved or unapproved style choice.');
      continue;
    }
    if (property.startsWith('designConfig.crownChoice.') && candidate.kind === 'crown') continue;
    if (candidate.visual?.dialFinish && (property.startsWith('designConfig.textureConfig.') || property.startsWith('designConfig.dialFaceConfig.texture.')) && permitted('target.appearance.texture')) continue;
    if (candidate.visual?.dialColor && property === 'designConfig.dialFaceConfig.color' && permitted('target.appearance.color')) continue;
    if (candidate.visual?.caseFinish && property === 'designConfig.visualReferenceConfig.caseFinish' && permitted('target.appearance.style')) continue;
    throw new Error(`Replacement also changes ${property}; this needs a separate explicit approval scope.`);
  }
  if (next.parts[targetId]?.catalogueItemId !== candidate.id) throw new Error('The component replacement was refused by the existing assembly rules.');
  return { assembly: next, result, changes, changedPartIds };
}

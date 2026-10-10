import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { archetypeCrownDefaults, crownCatalogueItems, presentationEvidence } from './catalogue';
import { validateCrownSpecification } from './validation';
import type { CrownSpecificationV1, EvidenceValue } from './types';

export const crownSpecificationForPart = (part?: WatchAssemblyPartInstance): CrownSpecificationV1 | undefined => {
  if (!part) return undefined;
  const candidate = part.crownSpecification ?? part.customProperties?.detachedCrownSpecification;
  if (candidate && validateCrownSpecification(candidate).status !== 'invalid') return candidate as CrownSpecificationV1;
  return getCatalogueItem(part.catalogueItemId)?.crownSpecification;
};

export const isCrownPart = (part: WatchAssemblyPartInstance): boolean => {
  const item = getCatalogueItem(part.catalogueItemId);
  return item ? item.kind === 'crown' : part.visual?.category === 'crown';
};
export const crownSlotError = (assembly: WatchAssembly, targetId: string, item: ComponentCatalogueItem): string | undefined => {
  const target = assembly.parts[targetId];
  if (!target) return 'The target component no longer exists.';
  if (['case', 'midcase'].includes(item.kind) && target.catalogueItemId !== item.id && Object.values(assembly.parts).some(p => isCrownPart(p) && p.locked)) return 'Unlock the operating crown before replacing its case platform.';
  if ((isCrownPart(target) && item.kind !== 'crown') || (!isCrownPart(target) && item.kind === 'crown')) return 'Crown options require an operating crown slot and a crown catalogue kind.';
  if (item.kind === 'crown' && item.visual && item.visual.category !== 'crown') return 'Crown visual category contradicts catalogue kind.';
  return undefined;
};

/** Advice is deterministic. Existing explicit/legacy choices always win. */
export const resolveCrownDefault = (assembly: WatchAssembly): { item?: ComponentCatalogueItem; source: 'explicit-user' | 'legacy-preserved' | 'case-supplied' | 'recommendation'; reason: string; evidence?: EvidenceValue<string> } => {
  const selected = assembly.designConfig?.crownChoice?.selected;
  const existing = selected ? assembly.parts[selected.crownInstanceId] : Object.values(assembly.parts).find(isCrownPart);
  const nominal = existing && getCatalogueItem(existing.catalogueItemId);
  const authoredLegacy = existing && (existing.catalogueItemId !== 'cat-crown' || existing.parametricGeometry || existing.crownSpecification || existing.visual || existing.material !== 'steel' || existing.texture !== 'knurled' || !['#E2E8F0', '#CBD5E1'].includes(existing.color) || existing.dimensions.diameterMm !== nominal?.nominalDimensions.diameterMm || existing.dimensions.thicknessMm !== nominal?.nominalDimensions.thicknessMm);
  if (existing && isCrownPart(existing) && (selected?.source === 'explicit-user' || selected?.source === 'legacy-preserved')) return { item: getCatalogueItem(existing.catalogueItemId), source: selected.source, reason: 'Preserved saved selection' };
  if (!selected && existing && assembly.designConfig?.crownChoice?.recommendedDefault?.catalogueItemId !== existing.catalogueItemId && authoredLegacy) return { item: getCatalogueItem(existing.catalogueItemId), source: 'legacy-preserved', reason: 'Preserved authored legacy crown' };
  const casePart = assembly.parts['inst-midcase'];
  const caseItem = casePart && getCatalogueItem(casePart.catalogueItemId);
  const bundle = caseItem?.suppliedCrown;
  if (bundle?.evidence.status === 'known' && ['supplier-statement', 'drawing'].includes(bundle.evidence.evidence.kind)) {
    const item = getCatalogueItem(bundle.catalogueItemId);
    if (item?.kind === 'crown' && !item.researchOnly) return { item, source: 'case-supplied', reason: 'Selected exact case bundle supplies this crown; interface fit still needs evidence', evidence: bundle.evidence };
  }
  const recommendation = caseItem?.recommendedCrown;
  if (recommendation?.evidence.status === 'known' && ['supplier-statement', 'drawing'].includes(recommendation.evidence.evidence.kind)) {
    const item = getCatalogueItem(recommendation.catalogueItemId);
    if (item?.kind === 'crown' && !item.researchOnly) return { item, source: 'recommendation', reason: 'Evidence-backed platform recommendation; verify all mating interfaces', evidence: recommendation.evidence };
  }
  const id = archetypeCrownDefaults[assembly.designConfig?.visualReferenceConfig?.archetypeId ?? ''] ?? 'knurled';
  return { item: crownCatalogueItems.find(item => item.id === `cat-crown-${id}`), source: 'recommendation', reason: 'Provisional archetype styling; no supplied crown established for this exact case' };
};

/** Called on platform/default transitions, never while loading saved documents. */
export const withCrownDefault = (assembly: WatchAssembly): WatchAssembly => {
  const resolved = resolveCrownDefault(assembly);
  const crown = Object.values(assembly.parts).find(isCrownPart);
  if (!crown || !resolved.item || crown.locked || resolved.source === 'explicit-user' || resolved.source === 'legacy-preserved') return assembly;
  const item = resolved.item;
  const next = structuredClone(assembly);
  const target = next.parts[crown.instanceId]!;
  target.catalogueItemId = item.id; target.name = item.displayName;
  target.dimensions = { ...target.dimensions, diameterMm: item.nominalDimensions.diameterMm, widthMm: item.nominalDimensions.widthMm, thicknessMm: item.nominalDimensions.thicknessMm };
  target.visual = item.visual ? { category: 'crown', assetId: item.visual.assetId } : undefined;
  target.parametricGeometry = undefined;
  target.crownSpecification = undefined;
  if (target.customProperties) delete target.customProperties.detachedCrownSpecification;
  // Catalogue spec remains available for appearance; no fabricated case axis is added.
  target.customProperties = { ...target.customProperties, crownDefaultCaseId: next.parts['inst-midcase']?.catalogueItemId };
  const refs = next.designConfig?.visualReferenceConfig;
  next.designConfig = { ...next.designConfig, crownChoice: {
    schema: 'crown-choice/v1',
    ...(resolved.source === 'case-supplied' ? { selected: { crownInstanceId: target.instanceId, source: 'case-supplied' as const } } : {}),
    recommendedDefault: { catalogueItemId: item.id, reason: resolved.reason, evidence: resolved.evidence ?? presentationEvidence(resolved.reason) },
  }, visualReferenceConfig: { ...refs, componentAssetOverrides: { ...refs?.componentAssetOverrides, crown: item.visual?.assetId } } };
  return next;
};

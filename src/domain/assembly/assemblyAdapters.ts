import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandKind } from '@/domain/bands/types';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { CatalogueReferenceError } from '@/domain/catalogue/catalogueValidation';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type {
  WatchComponentDefinition,
  WatchComponentEntity,
  WatchComponentKind
} from '@/domain/watch-components/types';
import type { WatchAssembly, WatchAssemblyPartInstance } from './assemblyTypes';

/**
 * Converts a WatchAssembly into the legacy BandEntity[] array
 * required by the current svgRenderer and bandsStore.
 * Derives regions from the authoritative 2.5D cylindrical geometry resolver.
 */
export const assemblyToBands = (assembly: WatchAssembly): BandEntity[] => {
  const resolved = resolveAssemblyGeometry(assembly);
  const pb = resolved.projected2DBands;
  const caseRadius = assembly.globalDimensions.caseDiameterMm / 2;

  const dialGeom = pb['dial-face'] ?? { innerRadius: 0, outerRadius: Math.max(1, caseRadius - 6) };
  const chapterGeom = pb['chapter-ring'] ?? { innerRadius: dialGeom.outerRadius, outerRadius: Math.max(dialGeom.outerRadius + 0.5, caseRadius - 3.5) };
  const innerBezelGeom = pb['inner-bezel'] ?? { innerRadius: chapterGeom.outerRadius, outerRadius: Math.max(chapterGeom.outerRadius + 0.5, caseRadius - 1.5) };
  const outerBezelGeom = pb['outer-bezel'] ?? { innerRadius: innerBezelGeom.outerRadius, outerRadius: caseRadius };

  return [
    createBand('band-dial-face', 'dial-face', dialGeom),
    createBand('band-chapter-ring', 'chapter-ring', chapterGeom),
    createBand('band-inner-bezel', 'inner-bezel', innerBezelGeom),
    createBand('band-outer-bezel', 'outer-bezel', outerBezelGeom)
  ];
};

/**
 * Converts a WatchAssemblyPartInstance into a legacy WatchComponentEntity
 * so the existing inspector panels and manufacturing exports continue to function.
 *
 * Enforces strict catalogue reference integrity.
 * If catalogueItemId cannot be resolved, an explicit CatalogueReferenceError is thrown.
 * No synthetic component kinds, manufacturing profiles, materials, or geometry are fabricated.
 */
export const partInstanceToLegacyEntity = (
  instance: WatchAssemblyPartInstance
): WatchComponentEntity => {
  if (!instance.catalogueItemId || instance.catalogueItemId.trim() === '') {
    throw new CatalogueReferenceError(
      instance.instanceId,
      '',
      `Part instance "${instance.instanceId}" has no catalogueItemId specified.`
    );
  }

  const catItem = getCatalogueItem(instance.catalogueItemId);
  if (!catItem) {
    throw new CatalogueReferenceError(
      instance.instanceId,
      instance.catalogueItemId,
      `Unresolvable catalogue reference: Part instance "${instance.instanceId}" references non-existent catalogue item "${instance.catalogueItemId}".`
    );
  }

  const kind = catItem.kind as WatchComponentKind;
  const category = catItem.category === 'dial' ? 'case' : catItem.category;
  const linkedBandKind = (catItem.linkedBandKind ?? null) as BandKind | null;

  const definition: WatchComponentDefinition = {
    kind,
    displayName: instance.name || catItem.displayName,
    category,
    inspectorSchemaId: `watch-${kind}`,
    linkedBandKind,
    defaultMaterial: catItem.defaultMaterial,
    defaultTexture: catItem.defaultTexture,
    exportEnabled: catItem.exportEnabled,
    pluginCompatibility: [catItem.manufacturing.processProfile, 'renderer', 'export-engine']
  };

  return {
    id: `watch-component-${definition.kind}`,
    definition,
    visible: instance.visible,
    locked: instance.locked,
    highlighted: false,
    material: instance.material || catItem.defaultMaterial,
    color: instance.color,
    texture: instance.texture || catItem.defaultTexture,
    dimensions: {
      diameterMm: instance.dimensions.diameterMm,
      widthMm: instance.dimensions.widthMm,
      thicknessMm: instance.dimensions.thicknessMm,
      offsetXmm: instance.dimensions.offsetXmm,
      offsetYmm: instance.dimensions.offsetYmm
    },
    typography: {
      fontFamily: instance.typography?.fontFamily ?? '"IBM Plex Mono", monospace',
      fontSizeMm: instance.typography?.fontSizeMm ?? 1.1,
      tracking: instance.typography?.tracking ?? 0
    },
    manufacturing: {
      processProfile: catItem.manufacturing.processProfile,
      minimumFeatureMm: catItem.manufacturing.minimumFeatureMm,
      minimumGapMm: catItem.manufacturing.minimumGapMm,
      minimumStrokeWidthMm: catItem.manufacturing.minimumStrokeWidthMm,
      recommendations: catItem.manufacturing.recommendations
    },
    validation: {
      valid: true,
      warnings: []
    },
    metadata: {
      tags: catItem.metadata.tags,
      revision: catItem.metadata.revision,
      notes: catItem.metadata.notes
    },
    exportEnabled: catItem.exportEnabled
  };
};

/**
 * Converts all parts of a WatchAssembly to legacy WatchComponentEntity[]
 */
export const assemblyToWatchComponentEntities = (
  assembly: WatchAssembly
): WatchComponentEntity[] => {
  return assembly.partOrder
    .map((instanceId) => assembly.parts[instanceId])
    .filter((instance): instance is WatchAssemblyPartInstance => instance !== undefined)
    .map(partInstanceToLegacyEntity);
};

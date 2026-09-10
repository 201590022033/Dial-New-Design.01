import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandKind } from '@/domain/bands/types';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type {
  WatchComponentDefinition,
  WatchComponentEntity,
  WatchComponentKind
} from '@/domain/watch-components/types';
import type { WatchAssembly, WatchAssemblyPartInstance } from './assemblyTypes';

/**
 * Converts a WatchAssembly into the legacy BandEntity[] array
 * required by the current svgRenderer and bandsStore.
 */
export const assemblyToBands = (assembly: WatchAssembly): BandEntity[] => {
  const dialPart = assembly.parts['inst-dial-blank'];
  const dialRadius = dialPart ? dialPart.dimensions.diameterMm / 2 : 14;

  const chapterPart = assembly.parts['inst-chapter-ring'];
  const chapterWidth = chapterPart ? chapterPart.dimensions.widthMm : 2.5;

  const innerBezelPart = assembly.parts['inst-inner-bezel'];
  const innerBezelWidth = innerBezelPart ? innerBezelPart.dimensions.widthMm : 1.5;

  const caseRadius = assembly.globalDimensions.caseDiameterMm / 2;

  const r0 = 0;
  const r1 = Math.min(dialRadius, caseRadius - 4);
  const r2 = Math.min(r1 + chapterWidth, caseRadius - 2);
  const r3 = Math.min(r2 + innerBezelWidth, caseRadius - 0.5);
  const r4 = caseRadius;

  return [
    createBand('band-dial-face', 'dial-face', { innerRadius: r0, outerRadius: r1 }),
    createBand('band-chapter-ring', 'chapter-ring', { innerRadius: r1, outerRadius: r2 }),
    createBand('band-inner-bezel', 'inner-bezel', { innerRadius: r2, outerRadius: r3 }),
    createBand('band-outer-bezel', 'outer-bezel', { innerRadius: r3, outerRadius: r4 })
  ];
};

/**
 * Converts a WatchAssemblyPartInstance into a legacy WatchComponentEntity
 * so the existing inspector panels and manufacturing exports continue to function.
 */
export const partInstanceToLegacyEntity = (
  instance: WatchAssemblyPartInstance
): WatchComponentEntity => {
  const catItem = getCatalogueItem(instance.catalogueItemId);

  const fallbackKind = instance.name.toLowerCase().replace(/\s+/g, '-') as WatchComponentKind;
  const kind = (catItem?.kind ?? fallbackKind) as WatchComponentKind;
  const category = instance.category === 'dial' ? 'case' : instance.category;
  const linkedBandKind = (catItem?.linkedBandKind ?? null) as BandKind | null;

  const definition: WatchComponentDefinition = {
    kind,
    displayName: instance.name,
    category,
    inspectorSchemaId: `watch-${kind}`,
    linkedBandKind,
    defaultMaterial: catItem?.defaultMaterial ?? instance.material,
    defaultTexture: catItem?.defaultTexture ?? instance.texture,
    exportEnabled: catItem?.exportEnabled ?? true,
    pluginCompatibility: catItem ? [catItem.manufacturing.processProfile, 'renderer', 'export-engine'] : ['renderer']
  };

  return {
    id: `watch-component-${definition.kind}`,
    definition,
    visible: instance.visible,
    locked: instance.locked,
    highlighted: false,
    material: instance.material,
    color: instance.color,
    texture: instance.texture,
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
      processProfile: catItem?.manufacturing.processProfile ?? 'cnc',
      minimumFeatureMm: catItem?.manufacturing.minimumFeatureMm ?? 0.2,
      minimumGapMm: catItem?.manufacturing.minimumGapMm ?? 0.15,
      minimumStrokeWidthMm: catItem?.manufacturing.minimumStrokeWidthMm ?? 0.1,
      recommendations: catItem?.manufacturing.recommendations ?? []
    },
    validation: {
      valid: true,
      warnings: []
    },
    metadata: {
      tags: catItem?.metadata.tags ?? [instance.category],
      revision: catItem?.metadata.revision ?? 'A',
      notes: catItem?.metadata.notes ?? ''
    },
    exportEnabled: true
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

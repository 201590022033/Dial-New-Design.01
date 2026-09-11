import type { DialProjectFile } from '@/services/projectFileService';
import type { BandEntity } from '@/domain/bands/types';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { defaultTypographyConfig } from '@/domain/generators/typographyEngine';
import { defaultMarkerConfig } from '@/domain/generators/markerEngine';
import { defaultDialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import type { ScaleKind, ScalePluginConfig } from '@/domain/scales/types';
import type { TemplateId } from '@/domain/generators/templateLibrary';
import { createDefaultWatchAssembly, WATCH_ASSEMBLY_VERSION } from './assemblyFactory';
import { assemblyToBands } from './assemblyAdapters';
import type { WatchAssembly } from './assemblyTypes';

const BANNED_TRANSIENT_KEYS = [
  'zoom',
  'panX',
  'panY',
  'selectedBandId',
  'selectedPartId',
  'selectedComponentId',
  'hoveredComponentId',
  'hoveredPartId',
  'selectionFilter',
  'previewMode',
  'lowPowerMode',
  'openSections',
  'inspectorOpenSections',
  'showGuides',
  'showSnapping',
  'history',
  'historyCounts',
  'pastCount',
  'futureCount'
];

/**
 * Validates that an object contains NO transient UI/session fields.
 */
export const assertNoTransientState = (data: unknown): void => {
  if (!data || typeof data !== 'object') {
    return;
  }

  const obj = data as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (BANNED_TRANSIENT_KEYS.includes(key)) {
      throw new Error(
        `Transient UI/session field "${key}" detected in canonical WatchAssembly document. Transient state must remain in UI stores.`
      );
    }
    if (obj[key] && typeof obj[key] === 'object') {
      assertNoTransientState(obj[key]);
    }
  }
};

/**
 * Serializes a canonical WatchAssembly to a clean JSON string.
 * Strictly guarantees that no transient UI state is written to the document.
 */
export const serializeWatchAssembly = (assembly: WatchAssembly): string => {
  assertNoTransientState(assembly);

  const cleanDocument: WatchAssembly = {
    version: assembly.version || WATCH_ASSEMBLY_VERSION,
    metadata: {
      ...assembly.metadata,
      updatedAtIso: assembly.metadata?.updatedAtIso ?? new Date().toISOString()
    },
    globalDimensions: { ...assembly.globalDimensions },
    parts: { ...assembly.parts },
    partOrder: [...assembly.partOrder],
    selectedColorPalette: { ...assembly.selectedColorPalette },
    ...(assembly.templateId ? { templateId: assembly.templateId } : {}),
    ...(assembly.scaleBinding ? { scaleBinding: assembly.scaleBinding } : {}),
    ...(assembly.designConfig ? { designConfig: assembly.designConfig } : {})
  };

  return JSON.stringify(cleanDocument, null, 2);
};

/**
 * Deserializes and validates a JSON string into a canonical WatchAssembly.
 */
export const deserializeWatchAssembly = (jsonString: string): WatchAssembly => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`Failed to parse WatchAssembly JSON: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid WatchAssembly: Root must be an object.');
  }

  const raw = parsed as Partial<WatchAssembly>;

  if (!raw.version || typeof raw.version !== 'string') {
    throw new Error('Invalid WatchAssembly: Missing or invalid "version" field.');
  }

  if (!raw.metadata || typeof raw.metadata.id !== 'string') {
    throw new Error('Invalid WatchAssembly: Missing or invalid "metadata" section.');
  }

  if (!raw.globalDimensions || typeof raw.globalDimensions.caseDiameterMm !== 'number') {
    throw new Error('Invalid WatchAssembly: Missing or invalid "globalDimensions" section.');
  }

  if (!raw.parts || typeof raw.parts !== 'object') {
    throw new Error('Invalid WatchAssembly: Missing or invalid "parts" mapping.');
  }

  if (!Array.isArray(raw.partOrder)) {
    throw new Error('Invalid WatchAssembly: Missing or invalid "partOrder" array.');
  }

  // Ensure no transient state was injected
  assertNoTransientState(raw);

  return raw as WatchAssembly;
};

/**
 * Migrates a legacy .dial project file into a canonical WatchAssembly.
 * Faithfully preserves user-authored generator/design metadata:
 * - marker layout, tick spacing, indices
 * - custom typography, fonts, tracking
 * - texture/finish configurations
 * - intermediate geometry parameters
 */
export const migrateLegacyProjectToAssembly = (legacy: DialProjectFile): WatchAssembly => {
  const defaultAssembly = createDefaultWatchAssembly();

  const migrated: WatchAssembly = {
    version: WATCH_ASSEMBLY_VERSION,
    metadata: {
      id: legacy.info.id,
      name: legacy.info.name,
      revision: legacy.info.revision,
      designer: legacy.info.designer,
      material: legacy.info.material,
      movement: legacy.info.movement,
      notes: legacy.info.manufacturingNotes,
      createdAtIso: legacy.info.createdAtIso,
      updatedAtIso: legacy.info.updatedAtIso
    },
    globalDimensions: {
      caseDiameterMm: legacy.geometry.caseDiameterMm,
      totalThicknessMm: defaultAssembly.globalDimensions.totalThicknessMm,
      bandGapMm: legacy.geometry.bandGapMm,
      manufacturingToleranceMm: legacy.geometry.manufacturingToleranceMm,
      laserKerfMm: legacy.geometry.laserKerfMm
    },
    parts: { ...defaultAssembly.parts },
    partOrder: [...defaultAssembly.partOrder],
    selectedColorPalette: {
      primary: legacy.design.colors.primary,
      secondary: legacy.design.colors.secondary,
      accent: legacy.design.colors.accent
    },
    templateId: legacy.design.templateId,
    scaleBinding: {
      scaleKind: legacy.scale.selectedScaleKind,
      config: legacy.scale.pluginConfig as unknown as Record<string, unknown>
    },
    designConfig: {
      markerConfig: legacy.design.markerConfig,
      typographyConfig: legacy.design.typographyConfig,
      textureConfig: legacy.design.textureConfig,
      geometryParameters: { ...legacy.geometry }
    }
  };

  // If legacy bands exist, update corresponding ring dimensions
  for (const band of legacy.bands) {
    const dialBlank = migrated.parts['inst-dial-blank'];
    const chapterRing = migrated.parts['inst-chapter-ring'];
    const rotatingBezel = migrated.parts['inst-rotating-bezel'];

    if (band.kind === 'dial-face' && dialBlank) {
      dialBlank.dimensions.diameterMm = band.geometry.outerRadius * 2;
    } else if (band.kind === 'chapter-ring' && chapterRing) {
      chapterRing.dimensions.diameterMm = band.geometry.outerRadius * 2;
      chapterRing.dimensions.widthMm = band.geometry.outerRadius - band.geometry.innerRadius;
    } else if (band.kind === 'outer-bezel' && rotatingBezel) {
      rotatingBezel.dimensions.diameterMm = band.geometry.outerRadius * 2;
      rotatingBezel.dimensions.widthMm = band.geometry.outerRadius - band.geometry.innerRadius;
    }
  }

  return migrated;
};

/**
 * Converts a canonical WatchAssembly back into a legacy DialProjectFile format
 * for backward-compatibility with older systems or file exports.
 * Faithfully re-projects preserved designConfig so no user customization is lost.
 */
export const exportAssemblyToLegacyProject = (assembly: WatchAssembly): DialProjectFile => {
  const bands: BandEntity[] = assemblyToBands(assembly);

  return {
    version: '1.0.0',
    info: {
      id: assembly.metadata.id,
      name: assembly.metadata.name,
      revision: assembly.metadata.revision,
      designer: assembly.metadata.designer,
      movement: assembly.metadata.movement,
      material: assembly.metadata.material,
      manufacturingNotes: assembly.metadata.notes,
      createdAtIso: assembly.metadata.createdAtIso,
      updatedAtIso: assembly.metadata.updatedAtIso
    },
    geometry: {
      ...defaultGeometryParameters,
      ...(assembly.designConfig?.geometryParameters ?? {}),
      caseDiameterMm: assembly.globalDimensions.caseDiameterMm,
      bandGapMm: assembly.globalDimensions.bandGapMm,
      manufacturingToleranceMm: assembly.globalDimensions.manufacturingToleranceMm,
      laserKerfMm: assembly.globalDimensions.laserKerfMm
    },
    bands,
    scale: {
      selectedScaleKind: (assembly.scaleBinding?.scaleKind as ScaleKind) || 'circular',
      pluginConfig: (assembly.scaleBinding?.config as unknown as ScalePluginConfig) || {
        startValue: 0,
        endValue: 60,
        majorStep: 5,
        minorStep: 1,
        direction: 'clockwise',
        radiusMm: 18,
        majorTickLengthMm: 1.8,
        minorTickLengthMm: 1,
        majorTickWidthMm: 0.2,
        minorTickWidthMm: 0.12,
        tickDirection: 'outside',
        tickStyle: 'line',
        labelFrequency: 1,
        labelOrientation: 'radial',
        labelPlacement: 'outside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#F8FAFC',
        fontFamily: '"IBM Plex Mono", monospace',
        previewEnabled: true,
        bandInnerRadiusMm: 14,
        bandOuterRadiusMm: 20,
        minimumLineWidthMm: 0.1
      },
      context: {
        startAngleDeg: -140,
        endAngleDeg: 140
      }
    },
    design: {
      templateId: (assembly.templateId as TemplateId) || 'classic-dress',
      markerConfig: assembly.designConfig?.markerConfig ?? defaultMarkerConfig,
      typographyConfig: assembly.designConfig?.typographyConfig ?? defaultTypographyConfig,
      textureConfig: assembly.designConfig?.textureConfig ?? defaultDialFaceConfig.texture,
      colors: {
        primary: assembly.selectedColorPalette.primary,
        secondary: assembly.selectedColorPalette.secondary,
        accent: assembly.selectedColorPalette.accent
      }
    },
    viewport: { zoom: 1, panX: 0, panY: 0 },
    selection: { selectedBandId: null },
    inspector: { openSections: [] },
    preferences: { showGuides: true, showSnapping: true },
    history: { pastCount: 0, futureCount: 0 }
  };
};

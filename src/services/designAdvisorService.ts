import { getTypographyAssetByFamily } from '@/domain/asset-library';
import type { ChapterRingConfiguration } from '@/domain/generators/chapterRingGenerator';
import type { DialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import type { MarkerEngineConfig } from '@/domain/generators/markerEngine';
import type { TypographyConfig } from '@/domain/generators/typographyEngine';
import type { ScaleKind } from '@/domain/scales/types';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import {
  defaultSupplierProfile,
  getSupplierProfileById,
  type SupplierProfile
} from '@/domain/manufacturing/supplierProfiles';
import { mapFontCategoryToTypographyFamily } from '@/services/assetLibraryService';

export interface DesignAdvisorRecommendation {
  id: string;
  severity: 'info' | 'opportunity' | 'warning';
  category: 'authenticity' | 'manufacturing' | 'geometry' | 'beauty';
  title: string;
  explanation: string;
  action: string;
}

export interface DesignAdvisorReport {
  supplierProfile: SupplierProfile;
  recommendations: DesignAdvisorRecommendation[];
  sourceCategories: string[];
}

const denseScaleKinds = new Set<ScaleKind>([
  'slide-rule',
  'tachymeter',
  'telemeter',
  'pulsometer',
  'fuel',
  'distance',
  'speed',
  'altitude',
  'conversion'
]);

const visuallyBusyTextures = new Set([
  'carbon-fibre',
  'clous-de-paris',
  'basketweave',
  'barleycorn',
  'rose-engine',
  'wave',
  'flame',
  'concentric',
  'engine-turning'
]);

const chooseSupplierProfile = (input: {
  selectedScaleKind: ScaleKind;
  markerConfig: MarkerEngineConfig;
  chapterRingConfig: ChapterRingConfiguration;
  supplierProfileId?: string | null;
}): SupplierProfile => {
  if (input.supplierProfileId) {
    const explicit = getSupplierProfileById(input.supplierProfileId);
    if (explicit) {
      return explicit;
    }
  }

  if (input.markerConfig.style.applied || input.chapterRingConfig.manufacturing === 'applied') {
    return getSupplierProfileById('precision-applied-index-house') ?? defaultSupplierProfile;
  }

  if (denseScaleKinds.has(input.selectedScaleKind) || input.markerConfig.count >= 60) {
    return getSupplierProfileById('instrument-print-specialist') ?? defaultSupplierProfile;
  }

  return defaultSupplierProfile;
};

export const buildDesignAdvisorReport = (input: {
  dialFaceConfig: DialFaceConfig;
  markerConfig: MarkerEngineConfig;
  typographyConfig: TypographyConfig;
  chapterRingConfig: ChapterRingConfiguration;
  selectedScaleKind: ScaleKind;
  manufacturingWarnings: ManufacturingWarning[];
  supplierProfileId?: string | null;
}): DesignAdvisorReport => {
  const supplierProfile = chooseSupplierProfile(input);
  const recommendations: DesignAdvisorRecommendation[] = [];
  const chapterRingWidth = input.chapterRingConfig.radiusOuterMm - input.chapterRingConfig.radiusInnerMm;
  const denseScale = denseScaleKinds.has(input.selectedScaleKind);
  const manufacturingCodes = new Set(input.manufacturingWarnings.map((warning) => warning.code));
  const typographyFamily = mapFontCategoryToTypographyFamily(input.typographyConfig.fontCategory);
  const typographyPreset = getTypographyAssetByFamily(typographyFamily);
  const sourceCategories = [...new Set(input.manufacturingWarnings.flatMap((warning) => warning.processIds ?? []))];

  if (denseScale && visuallyBusyTextures.has(input.dialFaceConfig.texture.kind)) {
    recommendations.push({
      id: 'texture-scale-competition',
      severity: 'warning',
      category: 'beauty',
      title: 'Texture may compete with dense scale markings',
      explanation: `The selected ${input.dialFaceConfig.texture.kind} texture adds visual activity that can reduce legibility on ${input.selectedScaleKind} layouts.`,
      action: 'Consider matte, sunburst, or a lower-contrast texture if the scale is the primary reading surface.'
    });
  }

  if (chapterRingWidth < 2.6 && input.typographyConfig.fontSizeMm <= 1.2) {
    recommendations.push({
      id: 'chapter-ring-width',
      severity: 'opportunity',
      category: 'geometry',
      title: 'Chapter ring is narrow for comfortable typography spacing',
      explanation: `The current chapter ring width is ${chapterRingWidth.toFixed(2)}mm, which leaves limited radial room for numerals and minute-track breathing space.`,
      action: 'Increasing the chapter ring width by about 0.3mm will improve label spacing and assembly tolerance.'
    });
  }

  if (denseScale && input.dialFaceConfig.finish !== 'matte') {
    recommendations.push({
      id: 'dense-scale-finish',
      severity: 'info',
      category: 'authenticity',
      title: 'Instrument-style scales usually prefer calmer dial finishes',
      explanation: `${input.selectedScaleKind} dials read more like authentic professional instruments when surface reflections do not compete with fine markings.`,
      action: 'A matte or restrained brushed finish will usually improve readability over decorative high-contrast surfaces.'
    });
  }

  if (manufacturingCodes.has('TEXT_TOO_SMALL') || manufacturingCodes.has('TEXT_LEGIBILITY')) {
    recommendations.push({
      id: 'text-height-recovery',
      severity: 'warning',
      category: 'manufacturing',
      title: 'Typography is approaching process limits',
      explanation: 'Current text sizing is at or below the preferred production threshold for the active supplier profile.',
      action: 'Increase text height, reduce copy length, or move branding to a wider dial zone before release.'
    });
  }

  if (typographyPreset && input.typographyConfig.fontSizeMm < typographyPreset.minimumPrintableSizeMm) {
    recommendations.push({
      id: 'typography-family-floor',
      severity: 'warning',
      category: 'manufacturing',
      title: 'Typography preset is below its printable floor',
      explanation: `The ${typographyPreset.family} typography profile recommends at least ${typographyPreset.minimumPrintableSizeMm.toFixed(2)}mm text size for stable production.`,
      action: `Increase text size or move text to a wider arc so ${typographyPreset.family} letterforms retain shape.`
    });
  }

  if (typographyPreset && input.typographyConfig.letterSpacing < typographyPreset.kerning) {
    recommendations.push({
      id: 'typography-kerning-recovery',
      severity: 'opportunity',
      category: 'beauty',
      title: 'Typography spacing is tighter than the profile baseline',
      explanation: `${typographyPreset.family} presets target at least ${typographyPreset.kerning.toFixed(2)}mm kerning and ${typographyPreset.recommendedArcSpacingMm.toFixed(2)}mm arc spacing for cleaner visual rhythm.`,
      action: 'Increase kerning or arc spacing to improve readability and professional finish.'
    });
  }

  if (manufacturingCodes.has('MIN_UV_PRINT') || manufacturingCodes.has('MIN_LINE_WIDTH')) {
    recommendations.push({
      id: 'fine-detail-recovery',
      severity: 'warning',
      category: 'manufacturing',
      title: 'Fine printed details are vulnerable',
      explanation: 'Some strokes are too fine for stable print transfer or finishing robustness.',
      action: 'Increase line width, simplify the graphic stack, or switch emphasis from printed detail to applied hardware.'
    });
  }

  if (
    supplierProfile.capabilities.appliedIndexCapability === 'not-offered' &&
    (input.markerConfig.style.applied || input.chapterRingConfig.manufacturing === 'applied')
  ) {
    recommendations.push({
      id: 'supplier-applied-index-mismatch',
      severity: 'warning',
      category: 'manufacturing',
      title: 'Selected construction exceeds the recommended supplier profile',
      explanation: `${supplierProfile.displayName} is tuned for printed instrument dials rather than applied furniture.`,
      action: 'Switch to the Precision Applied Index House profile or simplify the dial to a printed marker strategy.'
    });
  }

  if (
    supplierProfile.capabilities.multilayerDialCapability === 'single-level' &&
    (input.dialFaceConfig.style === 'sandwich' || input.markerConfig.style.applied)
  ) {
    recommendations.push({
      id: 'multilayer-stack-risk',
      severity: 'opportunity',
      category: 'manufacturing',
      title: 'Dial stack may benefit from a multi-level supplier',
      explanation: 'The current design language suggests more assembly depth than the default instrument-print profile is optimized for.',
      action: 'Use a stepped or multi-level supplier profile if you intend to keep sandwich layers or applied markers.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'balanced-baseline',
      severity: 'info',
      category: 'authenticity',
      title: 'Current dial is balanced for early manufacturing review',
      explanation: 'No strong advisor interventions were triggered by the current dial, scale, and supplier combination.',
      action: 'Use export verification next to confirm geometry and supplier-specific tolerances before release.'
    });
  }

  return {
    supplierProfile,
    recommendations,
    sourceCategories
  };
};
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { referenceScaleDefaults } from '@/services/referenceScaleArtworkService';
import { resolvePhysicalScaleConfig, resolveScaleLayers } from '@/services/scaleLayerArtworkService';

/** Mirrors the case preview control: purchased component dimensions are not scaled. */
export function milestone7Fixture(diameter: 34 | 42 | 46, design: 'citizen' | 'navitimer') {
  const assembly = createStarterBuild(diameter === 34 ? 'ladies-dress' : 'pilot').assembly;
  assembly.globalDimensions.caseDiameterMm = diameter;
  assembly.designConfig = { ...assembly.designConfig, geometryParameters: {
    ...assembly.designConfig?.geometryParameters, caseDiameterMm: diameter
  } };
  const bands = assemblyToBands(assembly);
  const physical = resolvePhysicalScaleConfig(assembly, bands, { ...getScalePlugin('slide-rule')!.defaultConfig,
    placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring', previewEnabled: true }, 'slide-rule');
  const config = { ...physical, ...referenceScaleDefaults(design, physical) };
  const result = resolveScaleLayers(assembly, bands, 'slide-rule', config, fullMinuteRingContext)!;
  return { assembly, bands, config, result };
}

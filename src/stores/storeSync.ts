import { useWatchAssemblyStore } from './watchAssemblyStore';
import { useGlobalSettingsStore } from './globalSettingsStore';
import { useBandsStore } from './bandsStore';
import { useWatchComponentStore } from './watchComponentStore';
import { useDesignEngineStore } from './designEngineStore';
import { assemblyToBands, assemblyToWatchComponentEntities } from '@/domain/assembly/assemblyAdapters';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { TemplateId } from '@/domain/generators/templateLibrary';

let isSyncing = false;

/**
 * syncAssemblyDownstream
 * Authoritative synchronization pipeline:
 * Projects the canonical WatchAssembly state down to legacy stores:
 * - globalSettingsStore
 * - bandsStore
 * - watchComponentStore
 * - designEngineStore
 *
 * Ensures the running UI and renderers observe exact engineering truth without
 * independent split-brain divergence.
 */
export const syncAssemblyDownstream = (assembly: WatchAssembly): void => {
  if (isSyncing) return;
  isSyncing = true;
  try {
    // 1. Sync globalSettingsStore (DERIVED / ADAPTER)
    useGlobalSettingsStore.setState({
      caseDiameterMm: assembly.globalDimensions.caseDiameterMm,
      bandGapMm: assembly.globalDimensions.bandGapMm,
      manufacturingToleranceMm: assembly.globalDimensions.manufacturingToleranceMm,
      laserKerfMm: assembly.globalDimensions.laserKerfMm,
      ...(assembly.designConfig?.geometryParameters ?? {})
    });

    // 2. Sync bandsStore (DERIVED / ADAPTER)
    const bands = assemblyToBands(assembly);
    useBandsStore.setState({ bands });

    // 3. Sync watchComponentStore (DERIVED / ADAPTER)
    try {
      const components = assemblyToWatchComponentEntities(assembly);
      useWatchComponentStore.setState({ components });
    } catch {
      // If references are unresolvable during a migration error, let validation report it
    }

    // 4. Sync designEngineStore (DERIVED / ADAPTER)
    if (assembly.designConfig) {
      const { markerConfig, typographyConfig, textureConfig } = assembly.designConfig;
      useDesignEngineStore.setState((prev) => ({
        markerConfig: markerConfig ? { ...prev.markerConfig, ...markerConfig } : prev.markerConfig,
        typographyConfig: typographyConfig ? { ...prev.typographyConfig, ...typographyConfig } : prev.typographyConfig,
        dialFaceConfig: textureConfig
          ? { ...prev.dialFaceConfig, texture: textureConfig }
          : prev.dialFaceConfig,
        activeTemplateId: (assembly.templateId as TemplateId) ?? prev.activeTemplateId,
        colors: { ...assembly.selectedColorPalette }
      }));
      useDesignEngineStore.getState().regenerate();
    }
  } finally {
    isSyncing = false;
  }
};

// Wire the listener immediately to watchAssemblyStore mutations
useWatchAssemblyStore.subscribe((state) => {
  syncAssemblyDownstream(state.assembly);
});

// Run initial sync on load
syncAssemblyDownstream(useWatchAssemblyStore.getState().assembly);

import { useWatchAssemblyStore } from './watchAssemblyStore';
import { useGlobalSettingsStore } from './globalSettingsStore';
import { useBandsStore } from './bandsStore';
import { useWatchComponentStore } from './watchComponentStore';
import { useDesignEngineStore } from './designEngineStore';
import { assemblyToBands, assemblyToWatchComponentEntities } from '@/domain/assembly/assemblyAdapters';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { TemplateId } from '@/domain/generators/templateLibrary';
import { useScaleStore } from './scaleStore';
import { getMovementDesignRecommendations } from '@/services/movementRecommendationService';
import { scaleSnapshotFromAssembly } from '@/domain/scales/scaleDocumentAdapter';

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
      ...(assembly.designConfig?.geometryParameters ?? {}),
      caseDiameterMm: assembly.globalDimensions.caseDiameterMm,
      bandGapMm: assembly.globalDimensions.bandGapMm,
      manufacturingToleranceMm: assembly.globalDimensions.manufacturingToleranceMm,
      laserKerfMm: assembly.globalDimensions.laserKerfMm
    });

    // 2. Sync bandsStore (DERIVED / ADAPTER)
    const bands = assemblyToBands(assembly);
    useBandsStore.setState({ bands });
    useScaleStore.getState().syncArchetypeScale(assembly.designConfig?.visualReferenceConfig?.archetypeId, bands);
    const savedScale = scaleSnapshotFromAssembly(assembly);
    if (savedScale) useScaleStore.getState().hydrateScaleState(savedScale);
    const scale = useScaleStore.getState();
    const targetBand = bands.find((band) => band.id === scale.pluginConfig.placementTargetBandId);
    if (!savedScale && targetBand && (
      scale.pluginConfig.bandInnerRadiusMm !== targetBand.geometry.innerRadius ||
      scale.pluginConfig.bandOuterRadiusMm !== targetBand.geometry.outerRadius
    )) {
      scale.syncFromBand(targetBand, useGlobalSettingsStore.getState().minimumLineWidthMm);
    } else if ((!scale.preview || !targetBand) && scale.previewEnabled && !scale.activeArchetypeId && scale.selectedScaleKind === 'circular') {
      // The initial UI advertises the diver program before a user selects an
      // archetype. Build its preview against the current bezel on first load.
      scale.applyScaleProgram('diver', bands);
    }

    // 3. Sync watchComponentStore (DERIVED / ADAPTER)
    try {
      const components = assemblyToWatchComponentEntities(assembly);
      useWatchComponentStore.setState({ components });
    } catch {
      // If references are unresolvable during a migration error, let validation report it
    }

    // 4. Sync designEngineStore (DERIVED / ADAPTER)
    useDesignEngineStore.setState({
      selectedMovementId: assembly.metadata.movement,
      movementRecommendations: getMovementDesignRecommendations(assembly.metadata.movement)
    });
    if (assembly.designConfig) {
      const { dialFaceConfig, markerConfig, typographyConfig, textureConfig } = assembly.designConfig;
      useDesignEngineStore.setState((prev) => ({
        markerConfig: markerConfig ? { ...prev.markerConfig, ...markerConfig } : prev.markerConfig,
        typographyConfig: typographyConfig ? { ...prev.typographyConfig, ...typographyConfig } : prev.typographyConfig,
        dialFaceConfig: dialFaceConfig
          ? {
              ...prev.dialFaceConfig,
              ...dialFaceConfig,
              border: { ...prev.dialFaceConfig.border, ...dialFaceConfig.border },
              centreHole: { ...prev.dialFaceConfig.centreHole, ...dialFaceConfig.centreHole },
              texture: {
                ...prev.dialFaceConfig.texture,
                ...dialFaceConfig.texture,
                ...textureConfig
              }
            }
          : textureConfig
            ? { ...prev.dialFaceConfig, texture: { ...prev.dialFaceConfig.texture, ...textureConfig } }
            : prev.dialFaceConfig,
        visualReferenceConfig: assembly.designConfig?.visualReferenceConfig ?? prev.visualReferenceConfig,
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
useWatchAssemblyStore.subscribe((state, previous) => {
  if (state.assembly !== previous.assembly) syncAssemblyDownstream(state.assembly);
});

// Run initial sync on load
syncAssemblyDownstream(useWatchAssemblyStore.getState().assembly);

useScaleStore.subscribe((state, previous) => {
  if (isSyncing || (state.pluginConfig === previous.pluginConfig && state.context === previous.context &&
    state.selectedScaleKind === previous.selectedScaleKind && state.previewEnabled === previous.previewEnabled && state.crossArchetypeUnlocked === previous.crossArchetypeUnlocked)) return;
  useWatchAssemblyStore.getState().setScaleSnapshot({ selectedScaleKind: state.selectedScaleKind,
    pluginConfig: state.pluginConfig, context: state.context, previewEnabled: state.previewEnabled, crossArchetypeUnlocked: state.crossArchetypeUnlocked },
    { selectedScaleKind: previous.selectedScaleKind, pluginConfig: previous.pluginConfig, context: previous.context,
      previewEnabled: previous.previewEnabled, crossArchetypeUnlocked: previous.crossArchetypeUnlocked });
});

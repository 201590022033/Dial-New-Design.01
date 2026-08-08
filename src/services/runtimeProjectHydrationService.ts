import type { DialProjectFile } from '@/services/projectFileService';
import { useBandsStore } from '@/stores/bandsStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useViewportStore } from '@/stores/viewportStore';

export const hydrateRuntimeProject = (project: DialProjectFile): void => {
  useGlobalSettingsStore.getState().updateGeometryParams(project.geometry);
  useBandsStore.getState().setBandsSnapshot(project.bands);
  useScaleStore.getState().hydrateScaleState(project.scale);
  useDesignEngineStore.getState().hydrateDesignState({
    templateId: project.design.templateId,
    markerConfig: project.design.markerConfig,
    typographyConfig: project.design.typographyConfig,
    textureConfig: project.design.textureConfig,
    colors: project.design.colors
  });
  useDesignEngineStore.getState().syncFromAssembly(project.bands);
  useViewportStore.setState({
    zoom: project.viewport.zoom,
    panX: project.viewport.panX,
    panY: project.viewport.panY
  });
  useSelectionStore.getState().selectBand(project.selection.selectedBandId);
};
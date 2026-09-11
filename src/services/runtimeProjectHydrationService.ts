import type { DialProjectFile } from '@/services/projectFileService';
import { migrateLegacyProjectToAssembly } from '@/domain/assembly/assemblySerialization';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useBandsStore } from '@/stores/bandsStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useViewportStore } from '@/stores/viewportStore';
import { useSourcingStore } from '@/stores/sourcingStore';

/**
 * Hydrates a runtime project into the canonical WatchAssembly store.
 * The WatchAssembly store then synchronizes downstream to legacy renderers and adapters.
 * Preserves specific custom physical bands and selection IDs from legacy project files.
 */
export const hydrateRuntimeProject = (project: DialProjectFile): void => {
  // 1. Authoritative migration to WatchAssembly
  const assembly = migrateLegacyProjectToAssembly(project);
  useWatchAssemblyStore.getState().setAssembly(assembly);

  // 2. If the persisted legacy project contains custom physical bands, preserve them in bandsStore
  if (project.bands && project.bands.length > 0) {
    useBandsStore.getState().setBandsSnapshot(project.bands);
    const chapterBand = project.bands.find((b) => b.kind === 'chapter-ring');
    if (chapterBand) {
      useDesignEngineStore.getState().updateChapterRingConfig({
        radiusInnerMm: chapterBand.geometry.innerRadius,
        radiusOuterMm: chapterBand.geometry.outerRadius
      });
    }
  }

  // 3. Initialize sourcing plan for this assembly
  useSourcingStore.getState().resetSourcingPlan(assembly.metadata.id);

  // 4. Hydrate transient and specialized subsystems
  useScaleStore.getState().hydrateScaleState(project.scale);
  useViewportStore.setState({
    zoom: project.viewport.zoom,
    panX: project.viewport.panX,
    panY: project.viewport.panY
  });
  useSelectionStore.getState().selectBand(project.selection.selectedBandId);
};

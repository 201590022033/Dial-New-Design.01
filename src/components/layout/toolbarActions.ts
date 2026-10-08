import type { WatchAssembly } from '@/domain/assembly';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useBandsStore, useDesignEngineStore, useExportStore, useProjectStore, useScaleStore, useSelectionStore } from '@/stores';
import { resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { buildEngineeringExport, exportEngineeringByFormat, type EngineeringExportRequest } from '@/services/exportService';

export const CASE_PREVIEW_MIN_MM = 20;
export const CASE_PREVIEW_MAX_MM = 60;

/** Preview envelope only: purchased part dimensions, catalogue IDs and hand lengths are untouched. */
export const resizeCasePreview = (assembly: WatchAssembly, diameter: number, lockedPartIds: ReadonlySet<string> = new Set()): WatchAssembly => {
  if (!Number.isFinite(diameter) || diameter < CASE_PREVIEW_MIN_MM || diameter > CASE_PREVIEW_MAX_MM) throw new Error('Enter a case preview diameter from 20 to 60 mm.');
  const cases = Object.values(assembly.parts).filter((part) => part.category === 'case');
  if (cases.some((part) => part.locked || lockedPartIds.has(part.instanceId))) throw new Error('Unlock the case before changing its preview diameter.');
  if (diameter === assembly.globalDimensions.caseDiameterMm) return assembly;
  return {
    ...assembly,
    globalDimensions: { ...assembly.globalDimensions, caseDiameterMm: diameter },
    designConfig: {
      ...assembly.designConfig,
      geometryParameters: { ...assembly.designConfig?.geometryParameters, caseDiameterMm: diameter }
    },
    metadata: { ...assembly.metadata, updatedAtIso: new Date().toISOString() }
  };
};

export const applyToolbarDiameter = (diameter: number): void => {
  const ui = useConfiguratorUIStore.getState();
  if (ui.previewStatus === 'previewing' || ui.archetypePreviewAssembly) throw new Error('Apply or cancel the component/build preview before resizing.');
  const store = useWatchAssemblyStore.getState();
  const assembly = resizeCasePreview(store.assembly, diameter, ui.lockedPartIds);
  if (assembly !== store.assembly) store.setAssembly(assembly);
};

export const createToolbarExportRequest = (format: 'svg' | 'dxf' | 'pdf'): EngineeringExportRequest => {
  const assembly = useWatchAssemblyStore.getState().assembly;
  const ui = useConfiguratorUIStore.getState();
  if (ui.previewStatus === 'previewing' || ui.archetypePreviewAssembly) throw new Error('Apply or cancel the preview before exporting the committed design.');
  const bands = useBandsStore.getState();
  const physicalBands = assemblyToBands(assembly);
  const scale = useScaleStore.getState();
  const project = useProjectStore.getState().info;
  const settings = useExportStore.getState();
  return {
    format, target: settings.target,
    filename: `${project.name.replace(/\s+/g, '-').toLowerCase() || 'dial-project'}.${format}`,
    bands: physicalBands, selectedBandId: useSelectionStore.getState().selectedBandId,
    context: { width: 900, height: 900, centerX: 450, centerY: 450, zoom: 1, panX: 0, panY: 0 },
    scalePreview: resolveScaleLayers(assembly, physicalBands, scale.selectedScaleKind, scale.pluginConfig, scale.context),
    designOverlay: useDesignEngineStore.getState().overlay,
    warnings: bands.manufacturingWarnings,
    metadata: { ...settings.metadata, projectName: project.name, movement: assembly.metadata.movement, caseDiameter: assembly.globalDimensions.caseDiameterMm, material: project.material, units: 'mm' }
  };
};

export const runToolbarExport = async (format: 'svg' | 'dxf' | 'pdf'): Promise<string[]> => {
  const request = createToolbarExportRequest(format);
  const warnings = buildEngineeringExport(request).preview.warnings.map((warning) => warning.message);
  useExportStore.getState().setFormat(format);
  useExportStore.getState().setPreviewWarnings(warnings);
  await exportEngineeringByFormat(request);
  return warnings;
};

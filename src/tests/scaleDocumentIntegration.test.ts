import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => { vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }); });
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useScaleStore } from '@/stores/scaleStore';
import { syncAssemblyDownstream } from '@/stores/storeSync';
import { runScalePlugin } from '@/services/scaleEngineService';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { resolvedScaleSvg, scaleArtworkSvgContent, scaleTickRadii } from '@/domain/scales/resolvedScaleArtwork';
import { estimateLabelRadialHalfExtentMm } from '@/domain/scales/placementEnvelope';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { generatePseudoDxf } from '@/services/exportGeometryService';
import { scaleArtworkClipEnvelope, scaleArtworkRadialShiftMm } from '@/visual3d/scaleArtworkEnvelope';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { useBandsStore } from '@/stores/bandsStore';

beforeEach(() => {
  useScaleStore.setState({ selectedScaleKind: 'circular', pluginConfig: getScalePlugin('circular')!.defaultConfig, activeArchetypeId: undefined });
  const assembly = createDefaultWatchAssembly();
  useWatchAssemblyStore.getState().setAssembly(assembly);
  useScaleStore.setState({ activeArchetypeId: undefined, crossArchetypeUnlocked: true });
  useScaleStore.getState().applyScaleProgram('aviation', assemblyToBands(assembly));
  useWatchAssemblyStore.getState().clearAssemblyHistory();
});

describe('canonical scale editing integration', () => {
  it.each(['outer-bezel', 'chapter-ring'])('refuses authoring on a locked %s target', (kind) => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const part = Object.values(assembly.parts).find((entry) => getCatalogueItem(entry.catalogueItemId)?.linkedBandKind === kind)!;
    expect(part).toBeDefined();
    useWatchAssemblyStore.getState().setAssembly({ ...assembly, parts: { ...assembly.parts, [part.instanceId]: { ...part, locked: true } } });
    const config = useScaleStore.getState().pluginConfig;
    useScaleStore.getState().updatePluginConfig({ color: '#000000' });
    expect(useScaleStore.getState().pluginConfig).toEqual(config);
  });
  it('makes the first legacy UI edit undoable and keeps its original reset baseline', () => {
    const state = useWatchAssemblyStore.getState();
    const legacy = { ...state.assembly, scaleBinding: undefined, designConfig: { ...state.assembly.designConfig, slideRuleLayers: undefined } };
    state.setAssembly(legacy);
    const before = useScaleStore.getState().pluginConfig;
    useScaleStore.getState().updatePluginConfig({ outerNumeralsVisible: false });
    state.undoAssembly();
    expect(useScaleStore.getState().pluginConfig.outerNumeralsVisible).toBe(before.outerNumeralsVisible);
    state.redoAssembly();
    useScaleStore.getState().resetSimplifiedBaseline();
    expect(useScaleStore.getState().pluginConfig.outerNumeralsVisible).toBe(before.outerNumeralsVisible);
  });
  it('persists colour, writing and angle; restores through Undo and Redo', () => {
    const before = useScaleStore.getState().pluginConfig;
    useScaleStore.getState().updatePluginConfig({ color: '#b58168', outerNumeralsVisible: false, outerRotationOffsetDeg: 81 });
    const assembly = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    expect(assembly.scaleBinding?.config).toMatchObject({ color: '#b58168', outerNumeralsVisible: false, outerRotationOffsetDeg: 81 });
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useScaleStore.getState().pluginConfig).toEqual(before);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useScaleStore.getState().pluginConfig).toMatchObject({ color: '#b58168', outerRotationOffsetDeg: 81 });
    useWatchAssemblyStore.getState().setAssembly(assembly);
    expect(useScaleStore.getState().preview?.labels.every((label) => label.ringId !== 'outer')).toBe(true);
  });
  it('persists disabled state without discarding the editable design', () => {
    useScaleStore.getState().setPreviewEnabled(false);
    const assembly = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    useWatchAssemblyStore.getState().setAssembly(assembly);
    expect(useScaleStore.getState().preview).toBeNull();
    expect(assembly.designConfig?.slideRuleLayers?.layers[0]?.activeDesign).toBeNull();
    useScaleStore.getState().setPreviewEnabled(true);
    expect(useScaleStore.getState().preview?.ticks.length).toBeGreaterThan(0);
  });
  it('does not accumulate history or reset rotation on repeated band synchronisation', () => {
    const bands = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    const band = bands.find((entry) => entry.id === useScaleStore.getState().pluginConfig.placementTargetBandId)!;
    useScaleStore.getState().syncFromBand(band, 0.1);
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 42 });
    const history = useWatchAssemblyStore.getState().historyPast.length;
    for (let i = 0; i < 5; i++) {
      syncAssemblyDownstream(useWatchAssemblyStore.getState().assembly);
      useScaleStore.getState().syncFromBand(band, 0.1);
    }
    expect(useWatchAssemblyStore.getState().historyPast.length).toBe(history);
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(42);
  });
  it('preserves independent target settings and resets the migration baseline', () => {
    const original = useScaleStore.getState().pluginConfig;
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 71, color: '#ff0000' });
    const bands = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    useScaleStore.getState().syncFromBand(bands.find((band) => band.kind === 'inner-bezel')!, 0.1);
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 29 });
    useScaleStore.getState().syncFromBand(bands.find((band) => band.kind === 'outer-bezel')!, 0.1);
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(71);
    useScaleStore.getState().resetSimplifiedBaseline();
    expect(useScaleStore.getState().pluginConfig).toEqual(original);
  });
  it('shares per-mark colours and writing between live SVG and ring export', () => {
    const preview = useScaleStore.getState().preview!;
    const id = preview.labels.find((label) => label.ringId === 'outer')!.id!;
    useScaleStore.getState().updatePluginConfig({ markColorOverrides: { [id]: '#e63946' } });
    const updated = useScaleStore.getState().preview!;
    expect(updated.labels.find((label) => label.id === id)?.color).toBe('#e63946');
    expect(resolvedScaleSvg(updated, 42, 'outer')).toContain(scaleArtworkSvgContent(updated, 1, 0, 0, 'outer'));
    const angles = updated.ticks.map((tick) => tick.angleDeg);
    useScaleStore.getState().updatePluginConfig({ outerNumeralsVisible: false });
    expect(useScaleStore.getState().preview!.ticks.map((tick) => tick.angleDeg)).toEqual(angles);
    expect(resolvedScaleSvg(useScaleStore.getState().preview!, 42, 'outer')).not.toContain('<text ');
  });
  it('exports the resolved ticks and numerals in millimetre DXF colour layers', () => {
    const preview = useScaleStore.getState().preview!;
    const dxf = generatePseudoDxf({ target: 'outer-bezel', bands: [], selectedBandId: null, scalePreview: preview,
      context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, designOverlay: null });
    expect(dxf.match(/\nLWPOLYLINE\n/g)).toHaveLength(75);
    expect(dxf.match(/\nTEXT\n/g)).toHaveLength(12);
    expect(dxf).toContain('$INSUNITS\n70\n4');
    expect(dxf).toContain('\n43\n0.15\n');
    expect(dxf).not.toContain('scale-inner');
  });
  it('uses the exact same physical envelope in HD without a second radial shift', () => {
    const preview = useScaleStore.getState().preview!;
    const model = watchAssemblyToVisualModel(useWatchAssemblyStore.getState().assembly);
    expect(scaleArtworkClipEnvelope(preview, model, 'outer')).toEqual(preview.placementEnvelope);
    expect(scaleArtworkClipEnvelope(preview, model, 'inner')).toEqual(preview.fixedPlacementEnvelope);
    expect(scaleArtworkRadialShiftMm(preview, model, 'outer')).toBe(0);
    expect(scaleArtworkRadialShiftMm(preview, model, 'inner')).toBe(0);
  });
  it('ignores stale legacy display-ring sizes when resolving canonical physical targets', () => {
    const before = useScaleStore.getState().preview!;
    useBandsStore.getState().setBandsSnapshot(useBandsStore.getState().bands.map((band) => ({ ...band, geometry: { innerRadius: 25, outerRadius: 26 } })));
    useScaleStore.getState().regeneratePreview();
    expect(useScaleStore.getState().preview!.placementEnvelope).toEqual(before.placementEnvelope);
    expect(useScaleStore.getState().preview!.fixedPlacementEnvelope).toEqual(before.fixedPlacementEnvelope);
  });
});

describe('physical annular artwork fit', () => {
  it('bounds both independently selected surfaces without changing calibration', () => {
    const config = { ...getScaleProgram('aviation', []).config, bandInnerRadiusMm: 17, bandOuterRadiusMm: 21,
      fixedBandInnerRadiusMm: 12, fixedBandOuterRadiusMm: 16, innerRadiusMm: 19, outerRadiusMm: 23, scaleFontSizeMm: 0.6 };
    const preview = runScalePlugin('slide-rule', { ...useScaleStore.getState().pluginConfig, ...config }, { startAngleDeg: 0, endAngleDeg: 360 })!;
    for (const tick of preview.ticks) {
      const [inner, outer] = tick.ringId === 'inner' ? [12, 16] : [17, 21];
      expect(Math.min(...scaleTickRadii(tick)) - tick.widthMm / 2).toBeGreaterThan(inner);
      expect(Math.max(...scaleTickRadii(tick)) + tick.widthMm / 2).toBeLessThan(outer);
    }
    for (const label of preview.labels) {
      const [inner, outer] = label.ringId === 'inner' ? [12, 16] : [17, 21];
      const half = estimateLabelRadialHalfExtentMm(label, preview.fontSizeMm);
      expect(label.radiusMm - half).toBeGreaterThan(inner);
      expect(label.radiusMm + half).toBeLessThan(outer);
    }
  });
  it('reports impossible widths instead of deleting required marks or changing angles', () => {
    const config = { ...useScaleStore.getState().pluginConfig, bandInnerRadiusMm: 20.9, bandOuterRadiusMm: 21,
      fixedBandInnerRadiusMm: 15.9, fixedBandOuterRadiusMm: 16, scaleFontSizeMm: 1.4 };
    const preview = runScalePlugin('slide-rule', config, { startAngleDeg: 0, endAngleDeg: 360 })!;
    expect(preview.validation.valid).toBe(false);
    expect(preview.validation.structuredWarnings.some((warning) => warning.affectedObject === 'scale-envelope')).toBe(true);
    expect(preview.ticks.filter((tick) => tick.ringId === 'outer')).toHaveLength(75);
    expect(preview.svg).toContain('clip-rule="evenodd"');
  });
});

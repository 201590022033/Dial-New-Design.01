import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { withScaleSnapshot, scaleSnapshotFromAssembly } from '@/domain/scales/scaleDocumentAdapter';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import '@/stores/storeSync';

const baseConfig = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
  placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring',
  previewEnabled: true, scaleFontSizeMm: .6, color: '#abcdef', outerRotationOffsetDeg: 32 };
const context = { startAngleDeg: 0, endAngleDeg: 360 };
const layer = () => useWatchAssemblyStore.getState().assembly.designConfig!.slideRuleLayers!.layers.find((entry) => entry.targetBandId === 'band-outer-bezel')!;

describe('reference scale state, isolated designs and authoritative history', () => {
  beforeEach(() => {
    useScaleStore.setState({ activeArchetypeId: undefined, crossArchetypeUnlocked: false });
    useWatchAssemblyStore.getState().setAssembly(withScaleSnapshot(createDefaultWatchAssembly(), {
      selectedScaleKind: 'slide-rule', pluginConfig: { ...baseConfig }, context
    }));
    useWatchAssemblyStore.getState().clearAssemblyHistory();
  });
  it('switches Citizen/Simplified in both directions without destroying independent settings', () => {
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(true);
    expect(layer().activeDesign).toBe('citizen');
    expect(layer().settings.simplified?.legacy.pluginConfig.color).toBe('#abcdef');
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom', referenceColourOverrides: { 'outer-light-ink': '#123456' }, outerRotationOffsetDeg: 81 });
    expect(useScaleStore.getState().selectReferenceDesign('simplified')).toBe(true);
    expect(useScaleStore.getState().pluginConfig.color).toBe('#abcdef');
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(32);
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(true);
    expect(useScaleStore.getState().pluginConfig.referenceColourOverrides).toEqual({ 'outer-light-ink': '#123456' });
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(81);
    expect(layer().activeDesign).toBe('citizen');
  });
  it('unticks and reenables the active design while preserving its configuration', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 44, referenceDistanceVisible: false });
    useScaleStore.getState().selectReferenceDesign(null);
    expect(layer().activeDesign).toBeNull();
    expect(useScaleStore.getState().previewEnabled).toBe(false);
    useScaleStore.getState().selectReferenceDesign('citizen');
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(44);
    expect(useScaleStore.getState().pluginConfig.referenceDistanceVisible).toBe(false);
  });
  it('restores original colour roles, visibility and registration without altering Simplified', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 77, referenceColourMode: 'custom', referenceColourOverrides: { 'outer-light-ink': '#123456' }, innerScaleVisible: false, referenceTickFactor: 1.3 });
    useScaleStore.getState().resetReferenceDesign();
    expect(useScaleStore.getState().pluginConfig).toMatchObject({ outerRotationOffsetDeg: 0, referenceColourMode: 'original', referenceColourOverrides: {}, innerScaleVisible: true, referenceTickFactor: 1 });
    expect(layer().settings.simplified?.legacy.pluginConfig.color).toBe('#abcdef');
  });
  it('persists reference identity and controls through save/load, including disabled state', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 71, referenceDistanceVisible: false, referenceLineFactor: 1.2 });
    useScaleStore.getState().selectReferenceDesign(null);
    const saved = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    expect(saved.designConfig!.slideRuleLayers!.layers[0]!.settings.citizen!.referenceId).toBe('citizen-jy8078-01l-2026-10-07');
    expect(scaleSnapshotFromAssembly(saved)).toMatchObject({ previewEnabled: false, pluginConfig: { referenceDesign: 'citizen', outerRotationOffsetDeg: 71, referenceDistanceVisible: false, referenceLineFactor: 1.2 } });
  });
  it('Undo/Redo restores the same selected design and controls observed by rendering', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 67 });
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(0);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(67);
    expect(layer().activeDesign).toBe('citizen');
  });
  it('respects locked physical targets and the archetype guard; Navitimer stays gated', () => {
    expect(useScaleStore.getState().selectReferenceDesign('navitimer')).toBe(false);
    useScaleStore.setState({ activeArchetypeId: 'archetype-dive', crossArchetypeUnlocked: false });
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
    useScaleStore.setState({ activeArchetypeId: undefined });
    useWatchAssemblyStore.getState().setPartLocked('inst-rotating-bezel', true);
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
  });
});

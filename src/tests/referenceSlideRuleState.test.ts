import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { withScaleSnapshot, scaleSnapshotFromAssembly } from '@/domain/scales/scaleDocumentAdapter';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { ReferenceSlideRulePanel, ReferenceSlideRuleSelections } from '@/components/configurator/ReferenceSlideRulePanel';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { isForbiddenConversionCaption } from '@/domain/scales/calibratedSlideRule';
import '@/stores/storeSync';

const baseConfig = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
  placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring',
  previewEnabled: true, scaleFontSizeMm: .6, color: '#abcdef', outerRotationOffsetDeg: 32 };
const context = { startAngleDeg: 0, endAngleDeg: 360 };
const layer = () => useWatchAssemblyStore.getState().assembly.designConfig!.slideRuleLayers!.layers.find((entry) => entry.targetBandId === 'band-outer-bezel')!;

describe('reference scale state, isolated designs and authoritative history', () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    useConfiguratorUIStore.setState({ lockedPartIds: new Set() });
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
  it('respects locked physical targets and the archetype guard for both references', () => {
    useScaleStore.setState({ activeArchetypeId: 'archetype-dive', crossArchetypeUnlocked: false });
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
    useScaleStore.setState({ activeArchetypeId: undefined });
    useWatchAssemblyStore.getState().setPartLocked('inst-rotating-bezel', true);
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
    expect(useScaleStore.getState().selectReferenceDesign('navitimer')).toBe(false);
  });
  it('keeps Citizen, Navitimer and Simplified colours/rotation isolated through repeated switching', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom', referenceColourOverrides: { 'km-yellow-pointer': '#123456' }, outerRotationOffsetDeg: 19 });
    expect(useScaleStore.getState().selectReferenceDesign('navitimer')).toBe(true);
    expect(layer().activeDesign).toBe('navitimer');
    expect(useScaleStore.getState().pluginConfig.referenceColourOverrides).toEqual({});
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom', referenceColourOverrides: { 'km-red-pointer': '#654321' }, outerRotationOffsetDeg: 42 });
    useScaleStore.getState().selectReferenceDesign('simplified');
    expect(useScaleStore.getState().pluginConfig.color).toBe('#abcdef');
    for (let cycle = 0; cycle < 2; cycle++) {
      useScaleStore.getState().selectReferenceDesign('citizen');
      expect(useScaleStore.getState().pluginConfig.referenceColourOverrides).toEqual({ 'km-yellow-pointer': '#123456' });
      expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(19);
      useScaleStore.getState().selectReferenceDesign('navitimer');
      expect(useScaleStore.getState().pluginConfig.referenceColourOverrides).toEqual({ 'km-red-pointer': '#654321' });
      expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(42);
    }
  });
  it('restores Navitimer registration/colours and persists its canonical source identity', () => {
    expect(useScaleStore.getState().selectReferenceDesign('navitimer')).toBe(true);
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom', outerRotationOffsetDeg: 99, referenceDistanceVisible: false, referenceTickFactor: 1.3 });
    useScaleStore.getState().resetReferenceDesign();
    expect(useScaleStore.getState().pluginConfig).toMatchObject({ referenceColourMode: 'original', outerRotationOffsetDeg: 0, referenceDistanceVisible: true, referenceTickFactor: 1 });
    const saved = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    expect(saved.designConfig!.slideRuleLayers!.layers[0]!.settings.navitimer!.referenceId).toBe('navitimer-booklet-training-disc-2026-10-07');
    expect(scaleSnapshotFromAssembly(saved)?.pluginConfig.referenceDesign).toBe('navitimer');
  });
  it('Undo/Redo restores mutual exclusion across reference switches, not overlaid brand artwork', () => {
    useScaleStore.getState().selectReferenceDesign('citizen');
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useScaleStore.getState().selectReferenceDesign('navitimer');
    expect(layer().activeDesign).toBe('navitimer');
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useScaleStore.getState().pluginConfig.referenceDesign).toBe('citizen');
    expect(layer().activeDesign).toBe('citizen');
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useScaleStore.getState().pluginConfig.referenceDesign).toBe('navitimer');
    expect(layer().activeDesign).toBe('navitimer');
  });
  it('the right inspector exposes the current reference palette without Citizen colour leakage', () => {
    // SSR normally uses the store's initial snapshot. For this deterministic
    // markup assertion, read the current edited snapshot instead (not UI acceptance).
    const serverSnapshot = vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom' });
    expect(renderToStaticMarkup(createElement(ReferenceSlideRulePanel))).toContain('km-yellow-pointer');
    useScaleStore.getState().selectReferenceDesign('navitimer');
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom' });
    const inspector = renderToStaticMarkup(createElement(ReferenceSlideRulePanel));
    expect(inspector).toContain('viewer page 2');
    expect(inspector).toContain('not the 1967 AOPA cover');
    expect(inspector).not.toContain('km-yellow-pointer');
    expect(inspector).not.toContain('inner-unit-yellow-box');
    const left = renderToStaticMarkup(createElement(ReferenceSlideRuleSelections));
    expect(left).toMatch(/aria-label="Classic Navitimer"[^>]*checked/);
    expect(left).not.toMatch(/aria-label="Citizen Skyhawk"[^>]*checked/);
    serverSnapshot.mockRestore();
  });
  it.each(['inst-rotating-bezel', 'inst-chapter-ring'])('visibly disables both reference panels when %s is locked', (part) => {
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    useScaleStore.getState().selectReferenceDesign('navitimer');
    useWatchAssemblyStore.getState().setPartLocked(part, true);
    for (const Panel of [ReferenceSlideRulePanel, ReferenceSlideRuleSelections]) {
      const markup = renderToStaticMarkup(createElement(Panel));
      expect(markup).toMatch(/<fieldset[^>]*disabled=""/);
      expect(markup).toContain('Scale target locked.');
    }
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
    useWatchAssemblyStore.getState().setPartLocked(part, false);
    expect(renderToStaticMarkup(createElement(ReferenceSlideRulePanel))).not.toMatch(/<fieldset[^>]*disabled/);
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(true);
  });
  it.each(['inst-rotating-bezel', 'inst-chapter-ring'])('honours the actual right-tray lock for %s in both controls and write guards', (part) => {
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    useScaleStore.getState().selectReferenceDesign('navitimer');
    useConfiguratorUIStore.getState().togglePartLock(part);
    for (const Panel of [ReferenceSlideRulePanel, ReferenceSlideRuleSelections]) {
      expect(renderToStaticMarkup(createElement(Panel))).toMatch(/<fieldset[^>]*disabled=""/);
    }
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(false);
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 44 });
    useScaleStore.getState().resetReferenceDesign();
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(0);
    useConfiguratorUIStore.getState().togglePartLock(part);
    expect(renderToStaticMarkup(createElement(ReferenceSlideRulePanel))).not.toMatch(/<fieldset[^>]*disabled/);
    expect(useScaleStore.getState().selectReferenceDesign('citizen')).toBe(true);
  });
  it('keeps separately edited physical bands isolated when reopening their selection', () => {
    useScaleStore.getState().selectReferenceDesign('navitimer');
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 73 });
    useScaleStore.getState().selectReferenceDesign(null);
    useScaleStore.getState().updatePluginConfig({ placementTargetBandId: 'band-inner-bezel' });
    useScaleStore.getState().selectReferenceDesign('citizen');
    useScaleStore.getState().updatePluginConfig({ outerRotationOffsetDeg: 28 });
    const outer = assemblyToBands(useWatchAssemblyStore.getState().assembly).find((band) => band.id === 'band-outer-bezel')!;
    useScaleStore.getState().syncFromBand(outer, .1);
    expect(useScaleStore.getState().pluginConfig.referenceDesign).toBe('navitimer');
    expect(useScaleStore.getState().pluginConfig.outerRotationOffsetDeg).toBe(73);
    expect(useScaleStore.getState().previewEnabled).toBe(false);
    const layers = useWatchAssemblyStore.getState().assembly.designConfig!.slideRuleLayers!.layers;
    expect(layers.find((entry) => entry.targetBandId === 'band-inner-bezel')?.settings.citizen?.outerRotationDeg).toBe(28);
  });
  it.each(['citizen', 'navitimer'] as const)('%s reset, save/load and disable never restore excluded conversions', (design) => {
    useScaleStore.getState().selectReferenceDesign(design);
    useScaleStore.getState().updatePluginConfig({ referenceColourMode: 'custom', referenceDistanceVisible: false });
    useScaleStore.getState().resetReferenceDesign();
    useScaleStore.getState().selectReferenceDesign(null);
    const saved = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    useWatchAssemblyStore.getState().setAssembly(saved);
    useScaleStore.getState().selectReferenceDesign(design);
    const active = useScaleStore.getState().preview?.layers?.find((entry) => entry.placementTargetBandId === 'band-outer-bezel') ?? useScaleStore.getState().preview;
    expect(active).toBeTruthy();
    expect(active!.labels.every((label) => !isForbiddenConversionCaption(label.text))).toBe(true);
    expect(active!.pointers?.every((pointer) => !pointer.dedicatedConversion || pointer.dedicatedConversion === 'distance')).toBe(true);
  });
});

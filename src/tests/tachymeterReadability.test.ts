import { describe, expect, it } from 'vitest';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { runScalePlugin } from '@/services/scaleEngineService';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { scaleSnapshotFromAssembly, withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';
import { resolvePhysicalScaleConfig } from '@/services/scaleLayerArtworkService';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { applyReference42Preview } from '@/domain/presets/reference3d';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';

describe('tachymeter baseline writing', () => {
  it('replaces retained starter writing while preserving explicit saved project opt-outs', async () => {
    const original = createStarterBuild('chronograph').assembly;
    const baseline = scaleSnapshotFromAssembly(original)!;
    const saved = withScaleSnapshot(original, {
      ...baseline,
      pluginConfig: { ...baseline.pluginConfig, labelOrientation: 'radial', allowAdaptiveLabelOmission: false }
    });
    expect(scaleSnapshotFromAssembly(saved)!.pluginConfig).toMatchObject({ labelOrientation: 'radial', allowAdaptiveLabelOmission: false });
    const fresh = scaleSnapshotFromAssembly(createStarterBuild('chronograph', saved).assembly)!;
    expect(fresh.pluginConfig).toMatchObject({ labelOrientation: 'horizontal', allowAdaptiveLabelOmission: true, optimizeLayout: true });
    const preview = runScalePlugin(fresh.selectedScaleKind, fresh.pluginConfig, fresh.context)!;
    expect(preview.labels.length).toBeLessThan(23);
    expect(preview.labels.every(label => label.orientation === 'horizontal')).toBe(true);
    const { syncAssemblyDownstream } = await import('@/stores/storeSync');
    const { useScaleStore } = await import('@/stores/scaleStore');
    const previous = useScaleStore.getState();
    try {
      // Re-loading the same archetype skips syncArchetypeScale defaults, so the
      // starter's saved snapshot must also carry the corrected writing policy.
      useScaleStore.setState({ activeArchetypeId: 'archetype-chronograph', pluginConfig: scaleSnapshotFromAssembly(saved)!.pluginConfig });
      syncAssemblyDownstream(createStarterBuild('chronograph', saved).assembly);
      expect(useScaleStore.getState().pluginConfig).toMatchObject({ labelOrientation: 'horizontal', allowAdaptiveLabelOmission: true });
      expect(useScaleStore.getState().preview!.labels.length).toBeLessThan(23);
      syncAssemblyDownstream(saved);
      expect(useScaleStore.getState().pluginConfig).toMatchObject({ labelOrientation: 'radial', allowAdaptiveLabelOmission: false });
    } finally {
      useScaleStore.setState(previous);
    }
  });

  it('selects separated labels without moving any reciprocal station or removing ticks', () => {
    const selection = getScaleProgram('chrono', []);
    const config = { ...getScalePlugin('tachymeter')!.defaultConfig, ...selection.config };
    const raw = runScalePlugin('tachymeter', { ...config, allowAdaptiveLabelOmission: false }, selection.context)!;
    const readable = runScalePlugin('tachymeter', config, selection.context)!;
    expect(readable.ticks).toEqual(raw.ticks);
    expect(readable.labels.length).toBeLessThan(raw.labels.length);
    expect(readable.labels.map(label => label.text)).toEqual(expect.arrayContaining(['60', '500']));
    for (const label of readable.labels) {
      expect(label.orientation).toBe('horizontal');
      expect(raw.labels.some(candidate => candidate.text === label.text && candidate.angleDeg === label.angleDeg)).toBe(true);
    }
    for (let index = 0; index < readable.labels.length; index++) {
      const left = readable.labels[index]!;
      for (const right of readable.labels.slice(index + 1)) {
        const delta = (left.angleDeg - right.angleDeg) * Math.PI / 180;
        const distance = Math.sqrt(left.radiusMm ** 2 + right.radiusMm ** 2 - 2 * left.radiusMm * right.radiusMm * Math.cos(delta));
        const extent = (Math.hypot(left.boundsMm!.width, left.boundsMm!.height) + Math.hypot(right.boundsMm!.width, right.boundsMm!.height)) / 2;
        expect(distance - extent).toBeGreaterThanOrEqual(0.12 - 1e-9);
      }
    }
  });

  it.each([false, true])('separates starter writing from every tick inside the physical annulus (reviewed source: %s)', (reviewed) => {
    const source = reviewed ? applyReference42Preview(createDefaultWatchAssembly()) : createDefaultWatchAssembly();
    source.globalDimensions.caseDiameterMm = 40;
    const assembly = createStarterBuild('chronograph', source).assembly;
    const snapshot = scaleSnapshotFromAssembly(assembly)!;
    const config = resolvePhysicalScaleConfig(assembly, assemblyToBands(assembly), snapshot.pluginConfig, snapshot.selectedScaleKind);
    const preview = runScalePlugin(snapshot.selectedScaleKind, config, snapshot.context)!;
    const tickInnerRadius = Math.min(...preview.ticks.map(tick => tick.radiusMm - tick.widthMm / 2));
    for (const label of preview.labels) {
      const half = Math.hypot(label.boundsMm!.width, label.boundsMm!.height) / 2;
      expect(label.radiusMm + half).toBeLessThanOrEqual(tickInnerRadius - 0.12 + 1e-9);
      expect(label.radiusMm - half).toBeGreaterThanOrEqual(preview.placementEnvelope.innerRadiusMm + preview.placementEnvelope.safetyMarginMm);
    }
  });
});

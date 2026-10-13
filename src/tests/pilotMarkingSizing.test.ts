import { describe, expect, it } from 'vitest';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { generateAviationRings } from '@/domain/scales/aviationSlideRule';
import { resizePilotRadius } from '@/domain/scales/pilotMarkingSizing';
import { customAviationDefaults } from '@/domain/scales/customAviation';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useScaleStore } from '@/stores/scaleStore';
import { referenceScaleDefaults, runReferenceScale } from '@/services/referenceScaleArtworkService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import '@/stores/storeSync';
const config = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config };
describe('pilot marking sizing', () => {
  it('enlarges Simplified graduations without changing calibrated stations', () => {
    const ticks = generateAviationRings(config).ticks;
    expect(ticks).toHaveLength(420);
    expect(ticks.find(t => t.value === 10)!.lengthMm).toBeCloseTo(.45 * 1.15);
    expect(ticks.find(t => t.value === 10)!.widthMm).toBeCloseTo(.15 * 1.15);
    expect(ticks.find(t => t.value === 14.9)!.lengthMm).toBeCloseTo(.2 * 1.15);
  });
  it.each(['citizen', 'navitimer'] as const)('enlarges %s graduations relative to the adjustable length factor', design => {
    const cfg = { ...config, ...referenceScaleDefaults(design, config) };
    const larger = runReferenceScale(cfg, fullMinuteRingContext)!;
    const original = runReferenceScale({ ...cfg, referenceTickFactor: 1 / 1.15, referenceLineFactor: 1 / 1.15 }, fullMinuteRingContext)!;
    expect(larger.ticks.map(t => t.angleDeg)).toEqual(original.ticks.map(t => t.angleDeg));
    for (let i = 0; i < larger.ticks.length; i++) {
      expect(larger.ticks[i]!.lengthMm).toBeCloseTo(original.ticks[i]!.lengthMm * 1.15);
      expect(larger.ticks[i]!.widthMm).toBeCloseTo(original.ticks[i]!.widthMm * 1.15);
    }
  });
  it.each(['simplified', 'citizen', 'navitimer'] as const)('preserves the %s rotating writing lane and independent fixed row during grow/shrink', design => {
    const oldAssembly = useWatchAssemblyStore.getState().assembly;
    const oldScale = useScaleStore.getState();
    try {
      useWatchAssemblyStore.getState().setAssembly(createStarterBuild('pilot').assembly);
      useScaleStore.getState().applyScaleProgram('aviation', assemblyToBands(useWatchAssemblyStore.getState().assembly));
      useScaleStore.getState().selectReferenceDesign(design);
      const initial = useScaleStore.getState().pluginConfig;
      for (const diameterMm of [38.5, 40, 37.5, 38]) {
        const part = useWatchAssemblyStore.getState().assembly.parts['inst-rotating-bezel']!;
        useWatchAssemblyStore.getState().updatePart(part.instanceId, { dimensions: { ...part.dimensions, diameterMm } });
        const band = assemblyToBands(useWatchAssemblyStore.getState().assembly).find(b => b.id === 'band-outer-bezel')!;
        useScaleStore.getState().syncFromBand(band, .1);
        const current = useScaleStore.getState().pluginConfig;
        expect(current.outerRadiusMm).toBeCloseTo(resizePilotRadius(initial.outerRadiusMm, initial, band.geometry.innerRadius, band.geometry.outerRadius));
        expect(current.innerRadiusMm).toBe(initial.innerRadiusMm);
        expect(current.referenceInnerTickRadiusMm).toBe(initial.referenceInnerTickRadiusMm);
        expect(current.referenceInnerNumeralRadiusMm).toBe(initial.referenceInnerNumeralRadiusMm);
        if (design !== 'simplified') {
          expect(current.referenceOuterTickRadiusMm).toBeCloseTo(resizePilotRadius(initial.referenceOuterTickRadiusMm, initial, band.geometry.innerRadius, band.geometry.outerRadius));
          expect(current.referenceOuterNumeralRadiusMm).toBeCloseTo(resizePilotRadius(initial.referenceOuterNumeralRadiusMm, initial, band.geometry.innerRadius, band.geometry.outerRadius));
        }
        const preview = useScaleStore.getState().preview!;
        const tick = preview.ticks.find(t => t.ringId === 'outer')!;
        const label = preview.labels.find(t => t.ringId === 'outer' && t.value === 10)!;
        expect(label.radiusMm).toBeGreaterThan(tick.radiusMm);
      }
    } finally {
      useWatchAssemblyStore.getState().setAssembly(oldAssembly);
      useScaleStore.setState(oldScale);
    }
  });
  it('defaults decimal dial lettering to a readable 0.7 mm, retaining knots default', () => {
    expect(customAviationDefaults('decimal-hour').fontSizeMm).toBe(.7);
    expect(customAviationDefaults('knots-mph').fontSizeMm).toBe(.4);
  });
});

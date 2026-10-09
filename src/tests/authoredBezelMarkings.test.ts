import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hideAuthoredBezelMarking } from '@/visual3d/authoredBezelMarkings';
import { scaleArtworkBinding } from '@/visual3d/scaleArtworkBinding';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { runScalePlugin } from '@/services/scaleEngineService';

const binary = readFileSync('public/assets/3d/archetypes/bezel-diver.glb');
const glb = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString()) as { nodes: { name: string; mesh?: number }[] };
const names = glb.nodes.filter(node => node.mesh !== undefined).map(node => node.name);
const preview = runScalePlugin('circular', { ...getScalePlugin('circular')!.defaultConfig,
  placementTargetBandId: 'band-outer-bezel', bandInnerRadiusMm: 16.3, bandOuterRadiusMm: 19.6,
  outerRadiusMm: 18, minorStep: 1, majorStep: 5 }, { startAngleDeg: 0, endAngleDeg: 360 })!;

describe('live bezel artwork replaces authored markings, never the bezel', () => {
  it('suppresses exactly the actual diver GLB 60 ticks and zero triangle for a live outer scale', () => {
    expect(scaleArtworkBinding(preview, 'band-outer-bezel')).not.toBeNull();
    expect(names.filter(name => hideAuthoredBezelMarking(name, true))).toHaveLength(61);
    for (const name of ['DD_ARCH_BEZEL_CARRIER', 'DD_ARCH_BEZEL_INSERT']) {
      expect(names).toContain(name);
      expect(hideAuthoredBezelMarking(name, true)).toBe(false);
    }
  });
  it('restores every default marking when the replacement is removed', () => {
    for (const active of [true, false, true, false]) {
      expect(names.filter(name => hideAuthoredBezelMarking(name, active))).toHaveLength(active ? 61 : 0);
    }
    expect(scaleArtworkBinding(null, 'band-outer-bezel')).toBeNull();
  });
  it('does not replace bezel defaults for a dial-only or empty retained row', () => {
    expect(scaleArtworkBinding({ ...preview, placementTargetBandId: 'band-dial' }, 'band-outer-bezel')).toBeNull();
    expect(scaleArtworkBinding({ ...preview, ticks: [], labels: [], pointers: [], substrates: [] }, 'band-outer-bezel')).toBeNull();
  });
  it('recognises chronograph print but never grip, dial markers or pilot artwork', () => {
    expect(hideAuthoredBezelMarking('DD_ARCH_TACHY_120', true)).toBe(true);
    for (const name of ['DD_ARCH_COIN_EDGE_0', 'DD_ARCH_DIAL_MARKER_0', 'DD_PILOT_SCALE_OUTER_TICK_60']) {
      expect(hideAuthoredBezelMarking(name, true)).toBe(false);
    }
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hideAuthoredBezelMarking as hideMarking, bezelArtworkContracts } from '@/visual3d/authoredBezelMarkings';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';
import { scaleArtworkBinding } from '@/visual3d/scaleArtworkBinding';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { runScalePlugin } from '@/services/scaleEngineService';

const binary = readFileSync('public/assets/3d/archetypes/bezel-diver.glb');
const glb = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString()) as { nodes: { name: string; mesh?: number }[] };
const names = glb.nodes.filter(node => node.mesh !== undefined).map(node => node.name);
const hideAuthoredBezelMarking = (name: string, active: boolean) => hideMarking(name, active, 'archetype-bezel-diver');
// A new mesh must be reviewed, even when old print-prefix counts still match.
const reviewedMeshCounts: Record<string, number> = {
  'archetype-bezel-diver': 63, 'archetype-bezel-chronograph': 18, 'archetype-bezel-pilot': 162,
  'archetype-bezel-dress': 1, 'archetype-bezel-field': 1, 'bezel-dive-coin-edge-42': 134,
  'bezel-dive-scalloped-42': 110, 'bezel-gmt-42': 122, 'bezel-tachymeter-fixed-42': 110,
  'bezel-slide-rule-42': 218, 'bezel-pilot-smooth-42': 1, 'bezel-dress-fluted-42': 73,
  'reference-42-bezel-preview': 64, 'bezel-knurled-42mm-v1': 98, 'bezel-diver-40mm-v1': 2,
  'bezel-diamond-rose-gold-34': 142, 'bezel-diamond-rose-gold-42': 175
};
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
    expect(hideMarking('DD_ARCH_TACHY_120', true, 'archetype-bezel-chronograph')).toBe(true);
    for (const name of ['DD_ARCH_COIN_EDGE_0', 'DD_ARCH_DIAL_MARKER_0', 'DD_PILOT_SCALE_OUTER_TICK_60']) {
      expect(hideAuthoredBezelMarking(name, true)).toBe(false);
    }
  });
  it('requires reviewed print contracts for EVERY registered bezel, including unmarked assets', () => {
    const bezels = Object.values(visualAssetRegistry).filter(asset => asset.category === 'bezel');
    expect(Object.keys(bezelArtworkContracts).sort()).toEqual(bezels.map(asset => asset.assetId).sort());
    for (const asset of bezels) {
      const contract = bezelArtworkContracts[asset.assetId]!;
      if (asset.assetType !== 'glb') { expect(contract.count).toBe(0); continue; }
      const bytes = readFileSync('public' + asset.assetPath);
      const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) as typeof glb;
      const meshNames = json.nodes.filter(node => node.mesh !== undefined).map(node => node.name);
      expect(meshNames, asset.assetId).toHaveLength(reviewedMeshCounts[asset.assetId]!);
      expect(meshNames.filter(name => hideMarking(name, true, asset.assetId)), asset.assetId).toHaveLength(contract.count);
      expect(meshNames.filter(name => hideMarking(name, false, asset.assetId)), asset.assetId).toHaveLength(0);
      // Never suppress physical structures or marker geometry on the dial.
      for (const name of meshNames.filter(name => /CARRIER|INSERT|EDGE|KNURL|PRONG|DIAMOND|SURFACE/.test(name))) {
        expect(hideMarking(name, true, asset.assetId), `${asset.assetId}: ${name}`).toBe(false);
      }
    }
  });
  it.each(['bezel-dive-coin-edge-42', 'bezel-dive-scalloped-42', 'bezel-gmt-42', 'bezel-tachymeter-fixed-42', 'bezel-slide-rule-42'])(
    'repeatedly replaces and restores the authored print for %s', assetId => {
      for (const active of [true, false, true, false]) {
        expect(hideMarking('DD_BEZEL_SCALE_00', active, assetId)).toBe(active);
        expect(hideMarking('DD_BEZEL_EDGE_00', active, assetId)).toBe(false);
        expect(hideMarking('DD_BEZEL_INSERT', active, assetId)).toBe(false);
      }
    });
  it('uses asset-specific ownership rather than hiding any similarly named mesh', () => {
    expect(hideMarking('DD_BEZEL_SCALE_00', true, 'unreviewed-bezel')).toBe(false);
    expect(hideMarking('DD_ARCH_BEZEL_SCALE_00', true, 'bezel-dive-coin-edge-42')).toBe(false);
    expect(hideMarking('DD_PILOT_SCALE_OUTER_TICK_60', true, 'archetype-bezel-pilot')).toBe(true);
    expect(hideMarking('DD_PILOT_SCALE_OUTER_TICK_60', false, 'archetype-bezel-pilot')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

type Node = { name: string; extras: Record<string, unknown>; translation: number[]; rotation: number[] };
type Asset = { path: string; sha256: string; nodes: Node[]; capabilities: { filledLumeNodes: string[]; registerNodes: string[]; explicitTipNodes: string[]; explicitOutlineLumeNodes: string[] } };
const audit = JSON.parse(readFileSync(resolve('docs/research/hand-region-audit-2026-10-09.json'), 'utf8')) as { assets: Asset[] };
const asset = (suffix: string) => audit.assets.find(entry => entry.path.endsWith(suffix))!;

describe('Milestone 6 hand-region baseline contracts', () => {
  it('records every audited binary exactly; intentional regeneration requires a reviewed refreshed inventory', () => {
    expect(audit.assets).toHaveLength(22);
    for (const entry of audit.assets) {
      const binary = readFileSync(resolve(entry.path));
      expect(createHash('sha256').update(binary).digest('hex'), entry.path).toBe(entry.sha256);
      const jsonLength = binary.readUInt32LE(12);
      const glb = JSON.parse(binary.subarray(20, 20 + jsonLength).toString('utf8')) as { nodes: Array<{ mesh?: number; name: string }> };
      expect(entry.nodes.map(node => node.name)).toEqual(glb.nodes.filter(node => node.mesh !== undefined).map(node => node.name));
    }
  });
  it('never mistakes existing filled lume for distinct tip or hollow-outline regions', () => {
    expect(asset('hands-pilot.glb').capabilities.filledLumeNodes).toHaveLength(2);
    expect(asset('hands-mercedes-42.glb').capabilities.filledLumeNodes).toHaveLength(3);
    expect(asset('hands-dauphine-42.glb').capabilities.filledLumeNodes).toHaveLength(0);
    for (const entry of audit.assets) {
      expect(entry.capabilities.explicitTipNodes, entry.path).toEqual([]);
      expect(entry.capabilities.explicitOutlineLumeNodes, entry.path).toEqual([]);
    }
  });
  it('pins the published NH05 compact 5/8/8mm radial tip metadata', () => {
    const compact = asset('hands-nh05-luminous-588.glb');
    for (const [role, length] of [['HOUR', 5], ['MINUTE', 8], ['SECONDS', 8]] as const) {
      const node = compact.nodes.find(entry => entry.name === `DD_HAND_${role}`)!;
      expect(node.extras.DD_TIP_LENGTH_MM).toBe(length);
      expect(node.extras.DD_ROLE).toBe(role.toLowerCase());
      expect(node.translation).toHaveLength(3);
    }
    expect(compact.capabilities.filledLumeNodes).toHaveLength(2);
  });
  it('keeps main hands and movement-owned VK63 registers distinct in all three register styles', () => {
    for (const style of ['needle', 'baton', 'syringe']) {
      const chrono = asset(`hands-chronograph-${style}.glb`);
      expect(chrono.capabilities.registerNodes).toHaveLength(3);
      for (const name of chrono.capabilities.registerNodes) {
        const node = chrono.nodes.find(entry => entry.name === name)!;
        expect(node.extras.DD_MOVEMENT).toBe('VK63');
        expect(node.extras.DD_REGISTER_HAND_STYLE).toBe(style);
        expect(node.extras.DD_REGISTER_CENTER_STATUS).toBe('PUBLISHED');
        expect([.37, .295, .32]).toContain(node.extras.DD_HAND_BORE_MM);
      }
      expect(chrono.nodes.some(node => node.name === 'DD_ARCH_HAND_0')).toBe(true);
      expect(chrono.nodes.some(node => node.name === 'DD_ARCH_HAND_1')).toBe(true);
      expect(chrono.nodes.some(node => node.name === 'DD_ARCH_CHRONO_SECONDS')).toBe(true);
    }
  });
});

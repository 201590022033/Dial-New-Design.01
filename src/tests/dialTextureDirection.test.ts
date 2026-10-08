import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateTextureGrain } from '@/domain/generators/textureEngine';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createDialFinishTexture } from '@/visual3d/dialFinishTexture';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import '@/stores/storeSync';

describe('shared physical dial finish grain', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('rotates brushed grain endpoints while retaining lengths, density and ink strength', () => {
    const base = { kind: 'brushed-metal' as const, intensity: .6, contrast: .7 };
    const horizontal = generateTextureGrain({ ...base, directionDeg: 0 }, 12.25);
    const vertical = generateTextureGrain({ ...base, directionDeg: 90 }, 12.25);
    expect(horizontal).toHaveLength(180);
    expect(vertical).toHaveLength(horizontal.length);
    horizontal.forEach((line, index) => {
      const other = vertical[index]!;
      expect(other.x1).toBeCloseTo(-line.y1, 10);
      expect(other.y1).toBeCloseTo(line.x1, 10);
      expect(other.x2).toBeCloseTo(-line.y2, 10);
      expect(other.y2).toBeCloseTo(line.x2, 10);
      expect(other.opacity).toBe(line.opacity);
      expect(Math.hypot(other.x1, other.y1)).toBeCloseTo(12.25, 10);
      expect(Math.hypot(other.x2, other.y2)).toBeCloseTo(12.25, 10);
    });
  });
  it('does not falsely expose direction for radial sunburst or matte', () => {
    const config = { kind: 'sunburst' as const, intensity: .6, contrast: .7 };
    expect(generateTextureGrain({ ...config, directionDeg: 0 }, 14)).toEqual(generateTextureGrain({ ...config, directionDeg: 90 }, 14));
    expect(generateTextureGrain({ ...config, kind: 'matte' }, 14)).toEqual([]);
    expect(generateTextureGrain({ ...config, intensity: 0 }, 14)).toEqual([]);
  });
  it('persists direction and projects the same config into Engineering and HD, with Undo', () => {
    const store = useWatchAssemblyStore.getState();
    store.setAssembly(createDefaultWatchAssembly());
    store.clearAssemblyHistory();
    const config = { kind: 'brushed-metal' as const, intensity: .6, contrast: .7, directionDeg: 45 };
    store.updateDialFaceConfig({ texture: config });
    const assembly = useWatchAssemblyStore.getState().assembly;
    expect(useDesignEngineStore.getState().overlay.dialFace.texture).toEqual(config);
    const restored = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    expect(restored.designConfig?.dialFaceConfig?.texture).toEqual(config);
    expect(watchAssemblyToVisualModel(restored).dial.textureDirectionDeg).toBe(45);
    store.undoAssembly();
    expect(useDesignEngineStore.getState().overlay.dialFace.texture?.kind).toBe('matte');
    store.redoAssembly();
    expect(useDesignEngineStore.getState().overlay.dialFace.texture?.directionDeg).toBe(45);
  });
  it('paints the exact shared grain into the HD PBR map and clears matte', () => {
    const drawn: number[][] = [];
    let start: number[] = [];
    const context = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1, fillRect: vi.fn(), beginPath: vi.fn(), moveTo: (x: number, y: number) => { start = [x, y]; }, lineTo: (x: number, y: number) => { drawn.push([...start, x, y]); }, stroke: vi.fn() };
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
    const config = { kind: 'brushed-metal' as const, intensity: .6, contrast: .7, directionDeg: 45 };
    const map = createDialFinishTexture(config, 28);
    expect(map).not.toBeNull();
    const grain = generateTextureGrain(config, 14);
    expect(drawn).toHaveLength(grain.length);
    expect(drawn[0]![0]).toBeCloseTo(512 + grain[0]!.x1 * 1024 / 28, 10);
    expect(drawn[0]![3]).toBeCloseTo(512 + grain[0]!.y2 * 1024 / 28, 10);
    expect(createDialFinishTexture({ ...config, kind: 'matte' }, 28)).toBeNull();
    map?.dispose();
  });
});

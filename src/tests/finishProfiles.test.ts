import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { finishProfiles, resolveFinishProfile } from '@/visual3d/finishProfiles';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('P7 finish profiles', () => {
  it('resolves registered finishes and keeps unknown values safe', () => {
    expect(resolveFinishProfile('polished-steel', 'brushed-steel').roughness).toBe(0.075);
    expect(resolveFinishProfile('missing-profile', 'brushed-steel').id).toBe('brushed-steel');
  });

  it('maps independent visual categories to finish profiles', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    expect(model.finishes.case.id).toBe('brushed-steel');
    expect(model.finishes.bezel.id).toBe('polished-steel');
    expect(model.finishes.crystal.id).toBe('sapphire');
    expect(model.finishes.crown.id).toBe('polished-steel');
  });

  it('provides optical and tactile presentation properties without manufacturing claims', () => {
    expect(finishProfiles.sapphire).toMatchObject({ transmission: 0.98, ior: 1.76, clearcoat: 1, provenance: 'provisional' });
    expect(finishProfiles.lume).toMatchObject({ emissiveIntensity: 0.42, provenance: 'provisional' });
    expect(finishProfiles.canvas.roughness).toBeGreaterThan(finishProfiles.leather.roughness);
    expect(finishProfiles.leather.roughness).toBeLessThan(finishProfiles.rubber.roughness);
  });
});

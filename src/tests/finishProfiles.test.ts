import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { resolveFinishProfile } from '@/visual3d/finishProfiles';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('P7 finish profiles', () => {
  it('resolves registered finishes and keeps unknown values safe', () => {
    expect(resolveFinishProfile('polished-steel', 'brushed-steel').roughness).toBe(0.12);
    expect(resolveFinishProfile('missing-profile', 'brushed-steel').id).toBe('brushed-steel');
  });

  it('maps independent visual categories to finish profiles', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    expect(model.finishes.case.id).toBe('brushed-steel');
    expect(model.finishes.bezel.id).toBe('polished-steel');
    expect(model.finishes.crystal.id).toBe('sapphire');
    expect(model.finishes.crown.id).toBe('polished-steel');
  });
});

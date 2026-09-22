import { describe, expect, it } from 'vitest';
import {
  archetypeKitLibrary,
  assessArchetypeKitForPlatform,
  NMK901_PLATFORM_ID,
  watchPlatformLibrary
} from '@/domain/library/watchPlatformLibrary';

describe('watch platform and archetype kit library', () => {
  it('does not claim physical validation before Golden Sample #1', () => {
    expect(watchPlatformLibrary[NMK901_PLATFORM_ID]?.evidenceStatus).toBe('GOLDEN_SAMPLE_PENDING');
  });

  it('maps non-chronograph visual kits to the shared NH35 platform', () => {
    for (const id of ['archetype-dive', 'archetype-field', 'archetype-pilot', 'archetype-dress-formal']) {
      expect(assessArchetypeKitForPlatform(id)).toMatchObject({ compatible: true, status: 'COMPATIBLE_KIT' });
      expect(archetypeKitLibrary[id]?.movementIds).toEqual(['nh35']);
    }
  });

  it('keeps movement-specific layouts presentation-only until platform and supplier mapping exist', () => {
    expect(archetypeKitLibrary['archetype-chronograph']).toMatchObject({
      status: 'PRESENTATION_ONLY', movementIds: ['vk63'], requiresSubdials: true, supplierMappingStatus: 'REQUIRED'
    });
    expect(assessArchetypeKitForPlatform('archetype-chronograph').compatible).toBe(false);
    expect(assessArchetypeKitForPlatform('archetype-gmt-travel').compatible).toBe(false);
  });
});

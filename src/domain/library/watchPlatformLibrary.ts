export type PlatformEvidenceStatus = 'GOLDEN_SAMPLE_PENDING' | 'VALIDATED_PLATFORM';
export type ArchetypeKitStatus = 'COMPATIBLE_KIT' | 'PRESENTATION_ONLY';

export interface WatchPlatformDefinition {
  platformId: string;
  label: string;
  evidenceStatus: PlatformEvidenceStatus;
  movementIds: string[];
  caseDiameterMm: number;
  lugWidthMm: number;
  notes: string[];
}

export interface ArchetypeKitDefinition {
  archetypeId: string;
  label: string;
  status: ArchetypeKitStatus;
  compatiblePlatformIds: string[];
  movementIds: string[];
  requiresSubdials: boolean;
  supplierMappingStatus: 'NOT_REQUIRED' | 'REQUIRED';
  reason: string;
}

export const NMK901_PLATFORM_ID = 'platform-nmk901-42-nh35';

export const watchPlatformLibrary: Record<string, WatchPlatformDefinition> = {
  [NMK901_PLATFORM_ID]: {
    platformId: NMK901_PLATFORM_ID,
    label: 'NMK901 / SKX007-SRPD 42 mm / NH35',
    evidenceStatus: 'GOLDEN_SAMPLE_PENDING',
    movementIds: ['nh35'],
    caseDiameterMm: 42,
    lugWidthMm: 22,
    notes: [
      'Shared chassis for Diver, Field, Pilot, Dress, Business and Casual visual kits.',
      'Estimated nominal interfaces remain subject to Golden Sample #1 validation.',
      'A validated-platform label is prohibited until the physical evidence gate passes.'
    ]
  }
};

const compatible = (archetypeId: string, label: string): ArchetypeKitDefinition => ({
  archetypeId, label, status: 'COMPATIBLE_KIT', compatiblePlatformIds: [NMK901_PLATFORM_ID],
  movementIds: ['nh35'], requiresSubdials: false, supplierMappingStatus: 'NOT_REQUIRED',
  reason: 'Presentation components retain the NMK901/NH35 interface envelope.'
});

export const archetypeKitLibrary: Record<string, ArchetypeKitDefinition> = {
  'archetype-dive': compatible('archetype-dive', 'Diver'),
  'archetype-field': compatible('archetype-field', 'Field'),
  'archetype-pilot': compatible('archetype-pilot', 'Pilot'),
  'archetype-dress-formal': compatible('archetype-dress-formal', 'Dress'),
  'archetype-business': compatible('archetype-business', 'Business'),
  'archetype-casual': compatible('archetype-casual', 'Casual'),
  'archetype-gmt-travel': {
    archetypeId: 'archetype-gmt-travel', label: 'GMT', status: 'PRESENTATION_ONLY', compatiblePlatformIds: [],
    movementIds: ['nh34'], requiresSubdials: false, supplierMappingStatus: 'REQUIRED',
    reason: 'The current NH35 controlled order does not provide the GMT hand stack or NH34 supplier mapping.'
  },
  'archetype-chronograph': {
    archetypeId: 'archetype-chronograph', label: 'Chronograph', status: 'PRESENTATION_ONLY', compatiblePlatformIds: [],
    movementIds: ['vk63'], requiresSubdials: true, supplierMappingStatus: 'REQUIRED',
    reason: 'The VK63 9/6/3 preview is movement-owned, but its case platform, dial geometry, register hand bores and commercial supplier map are not yet verified.'
  },
  'archetype-digital-sport': {
    archetypeId: 'archetype-digital-sport', label: 'Digital sport', status: 'PRESENTATION_ONLY', compatiblePlatformIds: [],
    movementIds: [], requiresSubdials: false, supplierMappingStatus: 'REQUIRED',
    reason: 'No digital module, display aperture or supplier-qualified case platform is mapped.'
  }
};

export const getArchetypeKit = (archetypeId: string | undefined): ArchetypeKitDefinition | undefined =>
  archetypeId ? archetypeKitLibrary[archetypeId] : undefined;

export const assessArchetypeKitForPlatform = (archetypeId: string | undefined, platformId = NMK901_PLATFORM_ID) => {
  const kit = getArchetypeKit(archetypeId);
  if (!kit) return { compatible: true, status: undefined, reason: 'No archetype kit is selected.' } as const;
  const compatibleWithPlatform = kit.status === 'COMPATIBLE_KIT' && kit.compatiblePlatformIds.includes(platformId);
  return { compatible: compatibleWithPlatform, status: kit.status, reason: kit.reason } as const;
};

/** Registered surface finishes shared by procedural fallbacks and authored GLB metadata. */
export type FinishProfileId = 'brushed-steel' | 'polished-steel' | 'blasted-steel' | 'black-pvd' | 'brass' | 'dial' | 'sapphire' | 'lume' | 'rubber' | 'leather' | 'canvas';

export interface FinishProfile {
  id: FinishProfileId;
  label: string;
  color: string;
  metalness: number;
  roughness: number;
  transmission?: number;
  opacity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  ior?: number;
  thickness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  sheen?: number;
  sheenRoughness?: number;
  provenance: 'specified' | 'provisional';
}

export const finishProfiles: Record<FinishProfileId, FinishProfile> = {
  'brushed-steel': { id: 'brushed-steel', label: 'Brushed steel', color: '#aeb8c4', metalness: 1, roughness: 0.3, clearcoat: 0.18, clearcoatRoughness: 0.22, provenance: 'provisional' },
  'polished-steel': { id: 'polished-steel', label: 'Polished steel', color: '#d4d9df', metalness: 1, roughness: 0.075, clearcoat: 0.35, clearcoatRoughness: 0.06, provenance: 'provisional' },
  'blasted-steel': { id: 'blasted-steel', label: 'Bead-blasted steel', color: '#aeb6bf', metalness: 0.82, roughness: 0.5, provenance: 'provisional' },
  'black-pvd': { id: 'black-pvd', label: 'Black PVD', color: '#16181b', metalness: 0.8, roughness: 0.28, provenance: 'provisional' },
  brass: { id: 'brass', label: 'Brass', color: '#b98945', metalness: 0.78, roughness: 0.3, provenance: 'provisional' },
  dial: { id: 'dial', label: 'Dial surface', color: '#0f172a', metalness: 0.02, roughness: 0.42, clearcoat: 0.12, clearcoatRoughness: 0.3, provenance: 'provisional' },
  sapphire: { id: 'sapphire', label: 'Sapphire crystal', color: '#e8f7ff', metalness: 0, roughness: 0.025, transmission: 0.98, opacity: 1, clearcoat: 1, clearcoatRoughness: 0.015, ior: 1.76, thickness: 0.75, provenance: 'provisional' },
  lume: { id: 'lume', label: 'Lume', color: '#dfffd2', metalness: 0, roughness: 0.38, emissive: '#73b867', emissiveIntensity: 0.42, provenance: 'provisional' },
  rubber: { id: 'rubber', label: 'Vulcanized rubber', color: '#111318', metalness: 0, roughness: 0.62, sheen: 0.18, sheenRoughness: 0.7, provenance: 'provisional' },
  leather: { id: 'leather', label: 'Leather', color: '#4b2d1c', metalness: 0, roughness: 0.46, clearcoat: 0.08, clearcoatRoughness: 0.55, sheen: 0.32, sheenRoughness: 0.6, provenance: 'provisional' },
  canvas: { id: 'canvas', label: 'Woven canvas', color: '#4a4a32', metalness: 0, roughness: 0.88, sheen: 0.12, sheenRoughness: 0.9, provenance: 'provisional' }
};

export const resolveFinishProfile = (value: string | undefined, fallback: FinishProfileId): FinishProfile =>
  (value && value in finishProfiles ? finishProfiles[value as FinishProfileId] : finishProfiles[fallback]);

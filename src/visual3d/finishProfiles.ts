/** Registered surface finishes shared by procedural fallbacks and authored GLB metadata. */
export type FinishProfileId = 'brushed-steel' | 'polished-steel' | 'blasted-steel' | 'black-pvd' | 'brass' | 'dial' | 'sapphire' | 'lume';

export interface FinishProfile {
  id: FinishProfileId;
  label: string;
  color: string;
  metalness: number;
  roughness: number;
  transmission?: number;
  opacity?: number;
  provenance: 'specified' | 'provisional';
}

export const finishProfiles: Record<FinishProfileId, FinishProfile> = {
  'brushed-steel': { id: 'brushed-steel', label: 'Brushed steel', color: '#b8c0ca', metalness: 0.85, roughness: 0.34, provenance: 'provisional' },
  'polished-steel': { id: 'polished-steel', label: 'Polished steel', color: '#c8d0da', metalness: 0.9, roughness: 0.12, provenance: 'provisional' },
  'blasted-steel': { id: 'blasted-steel', label: 'Bead-blasted steel', color: '#aeb6bf', metalness: 0.82, roughness: 0.5, provenance: 'provisional' },
  'black-pvd': { id: 'black-pvd', label: 'Black PVD', color: '#16181b', metalness: 0.8, roughness: 0.28, provenance: 'provisional' },
  brass: { id: 'brass', label: 'Brass', color: '#b98945', metalness: 0.78, roughness: 0.3, provenance: 'provisional' },
  dial: { id: 'dial', label: 'Dial surface', color: '#0f172a', metalness: 0.05, roughness: 0.52, provenance: 'provisional' },
  sapphire: { id: 'sapphire', label: 'Sapphire crystal', color: '#bfe8ff', metalness: 0, roughness: 0.08, transmission: 0.28, opacity: 0.22, provenance: 'provisional' },
  lume: { id: 'lume', label: 'Lume', color: '#9dff75', metalness: 0.05, roughness: 0.3, provenance: 'provisional' }
};

export const resolveFinishProfile = (value: string | undefined, fallback: FinishProfileId): FinishProfile =>
  (value && value in finishProfiles ? finishProfiles[value as FinishProfileId] : finishProfiles[fallback]);

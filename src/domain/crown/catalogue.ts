import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { migrateLegacyCrown } from './legacy';
import type { CrownSpecificationV1, EvidenceValue } from './types';

export const crownPresentations = [
  { id: 'smooth', label: 'Smooth', shape: 'cylindrical', grip: 'smooth', core: 6.5, max: 6.5, length: 3.5 },
  { id: 'fine-fluted', label: 'Fine fluted', shape: 'cylindrical', grip: 'fine-fluted', core: 6.5, max: 6.9, length: 3.5 },
  { id: 'coarse-fluted', label: 'Coarse fluted', shape: 'cylindrical', grip: 'coarse-fluted', core: 6.5, max: 7.1, length: 3.5 },
  { id: 'knurled', label: 'Cross knurled', shape: 'cylindrical', grip: 'cross-knurled', core: 6.5, max: 6.9, length: 3.5 },
  { id: 'onion', label: 'Onion', shape: 'onion', grip: 'fine-fluted', core: 6, max: 7, length: 4 },
  { id: 'compact-dress', label: 'Compact dress', shape: 'compact-dress', grip: 'fine-fluted', core: 5, max: 5.2, length: 2.5 },
] as const;
export const presentationEvidence = <T>(value: T): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'visual-approximation', source: 'Crown C2/C3 presentation family; no supplier interface or sealing qualification' } });

export const crownCatalogueItems: ComponentCatalogueItem[] = crownPresentations.map(p => {
  const specification: CrownSpecificationV1 = migrateLegacyCrown({ material: 'steel', color: '#d4d9df', texture: 'polished' }).specification;
  specification.shape = presentationEvidence(p.shape);
  specification.grip = presentationEvidence(p.grip);
  specification.coreDiameterMm = presentationEvidence(p.core);
  specification.maximumOuterDiameterMm = presentationEvidence(p.max);
  specification.headLengthMm = presentationEvidence(p.length);
  specification.finish = { mode: 'inherit-case' };
  // Appearance options do not select a closure or a cap conversion.
  return {
    id: `cat-crown-${p.id}`, kind: 'crown', displayName: `${p.label} crown — concept`, category: 'external',
    defaultMaterial: 'steel', defaultTexture: 'polished', linkedBandKind: null,
    nominalDimensions: { diameterMm: p.core, widthMm: p.max, thicknessMm: p.length },
    manufacturing: { processProfile: 'cnc', minimumFeatureMm: .2, minimumGapMm: .2, minimumStrokeWidthMm: .12, recommendations: ['Presentation only; confirm stem, tube, gaskets and installation before procurement.'] },
    softStyles: ['crown', p.id, 'presentation'], status: 'draft',
    metadata: { tags: ['crown', 'concept'], revision: 'C3', notes: 'Appearance only. Closure and physical interfaces are not established. No water-resistance claim.' },
    visual: { category: 'crown', assetId: `crown-${p.id}`, representation: 'glb', status: 'provisional' },
    crownSpecification: specification, exportEnabled: false,
  };
});

export const archetypeCrownDefaults: Record<string, string> = {
  'archetype-dive': 'knurled', 'archetype-pilot': 'onion', 'archetype-field': 'coarse-fluted',
  'archetype-dress-formal': 'fine-fluted', 'archetype-ladies-dress-nh05': 'compact-dress',
  'archetype-business': 'fine-fluted', 'archetype-gmt-travel': 'knurled', 'archetype-chronograph': 'fine-fluted',
  'archetype-digital-sport': 'smooth', 'archetype-casual': 'smooth',
};

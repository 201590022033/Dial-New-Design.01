import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { applyArchetypeVisualProfile } from './archetypeProfiles';

export type StarterBuildType = 'diver' | 'pilot' | 'dress' | 'field' | 'chronograph';

export interface StarterPartExplanation {
  partInstanceId: string;
  catalogueItemId: string;
  componentName: string;
  reasons: string[];
}

export interface StarterBuildDefinition {
  buildType: StarterBuildType;
  title: string;
  description: string;
  assembly: WatchAssembly;
  partExplanations: StarterPartExplanation[];
}

export const createStarterBuild = (
  buildType: StarterBuildType = 'diver',
  sourceAssembly: WatchAssembly = createDefaultWatchAssembly()
): StarterBuildDefinition => {
  const archetypeIds: Record<StarterBuildType, string> = {
    diver: 'archetype-dive', pilot: 'archetype-pilot', dress: 'archetype-dress-formal',
    field: 'archetype-field', chronograph: 'archetype-chronograph'
  };
  const titles: Record<StarterBuildType, string> = {
    diver: 'Dive watch baseline', pilot: 'Pilot watch baseline', dress: 'Dress watch baseline',
    field: 'Field watch baseline', chronograph: 'Chronograph baseline'
  };
  const descriptions: Record<StarterBuildType, string> = {
    diver: 'High-lume dial, rotating dive bezel and high-contrast tool-watch composition.',
    pilot: 'Large Arabic markers, restrained bezel and high-legibility aviation composition.',
    dress: 'Light minimal dial, fine markers and polished formal-watch composition.',
    field: 'Matte utility dial, Arabic markers and subdued outdoor color palette.',
    chronograph: 'Two-tone timing dial, tachymeter reference and chronograph movement layout.'
  };
  let base = applyArchetypeVisualProfile(sourceAssembly, archetypeIds[buildType]);
  if (buildType === 'chronograph') {
    const pushers = base.parts['inst-pushers'];
    base = {
      ...base,
      metadata: { ...base.metadata, movement: 'vk63' },
      parts: pushers
        ? { ...base.parts, 'inst-pushers': { ...pushers, visible: true } }
        : base.parts
    };
  }

  const partExplanations: StarterPartExplanation[] = [
    {
      partInstanceId: 'inst-movement',
      catalogueItemId: 'cat-movement-nh35',
      componentName: 'Seiko NH35A Automatic Movement',
      reasons: [
        'Broad physical compatibility across modding cases',
        'Proven reliability and 41-hour power reserve',
        'High supplier availability and affordable replacement cost',
        'Standard 3.0h stem alignment'
      ]
    },
    {
      partInstanceId: 'inst-case',
      catalogueItemId: 'cat-case-skx007',
      componentName: '316L Stainless Steel Dive Case (SKX007 Spec)',
      reasons: [
        'Matches 28.5mm standard dial seat and NH35 casing diameter',
        'Standard 200m water-resistant gasket rebate',
        'Avoids custom machining or fabrication charges'
      ]
    },
    {
      partInstanceId: 'inst-dial',
      catalogueItemId: 'cat-dial-sunburst',
      componentName: '28.5mm Sunburst Blue Dial',
      reasons: [
        'Exact 28.5mm diameter fits case dial seat with 0.5mm clearance',
        'Pre-fitted dial feet for NH35 3h crown position',
        'Verified factory manufacturing tolerances'
      ]
    },
    {
      partInstanceId: 'inst-hands-hour',
      catalogueItemId: 'cat-hand-mercedes-hour',
      componentName: 'Mercedes Hour Hand',
      reasons: [
        'Collet diameter 1.50mm mates exactly with NH35 hour wheel arbor',
        'Axial stack height clears crystal underside'
      ]
    },
    {
      partInstanceId: 'inst-hands-minute',
      catalogueItemId: 'cat-hand-mercedes-minute',
      componentName: 'Mercedes Minute Hand',
      reasons: [
        'Collet diameter 0.90mm mates with NH35 cannon pinion',
        'Radial tip length clears chapter ring rehaut'
      ]
    },
    {
      partInstanceId: 'inst-hands-second',
      catalogueItemId: 'cat-hand-mercedes-second',
      componentName: 'Mercedes Second Hand',
      reasons: [
        'Collet diameter 0.20mm mates with NH35 seconds pinion',
        'Total stack height stays well within crystal clearance'
      ]
    },
    {
      partInstanceId: 'inst-crystal',
      catalogueItemId: 'cat-flat-sapphire',
      componentName: 'Flat Sapphire Crystal with AR Coating',
      reasons: [
        '31.5mm diameter fits case crystal seat with gasket retention',
        'High scratch resistance and optical clarity'
      ]
    },
    {
      partInstanceId: 'inst-chapter-ring',
      catalogueItemId: 'cat-chapter-ring-matte',
      componentName: 'Matte Black Chapter Ring',
      reasons: [
        'Outer diameter 30.5mm fits case rehaut rebate',
        'Locating pin aligns with case slot'
      ]
    }
  ];

  return {
    buildType,
    title: titles[buildType],
    description: descriptions[buildType],
    assembly: base,
    partExplanations
  };
};

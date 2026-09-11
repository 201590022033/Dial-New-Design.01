import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';

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

export const createStarterBuild = (buildType: StarterBuildType = 'diver'): StarterBuildDefinition => {
  const base = createDefaultWatchAssembly();

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
    title: 'Best-value default build',
    description: 'Emphasizes broad physical compatibility, verified components, and practical availability.',
    assembly: base,
    partExplanations
  };
};

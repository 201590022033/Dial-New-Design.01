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
  status: 'VERIFIED_SPEC' | 'PRESENTATION_ONLY';
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

  const nh35PartExplanations: StarterPartExplanation[] = [
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

  const chronographPartExplanations: StarterPartExplanation[] = [
    {
      partInstanceId: 'inst-movement', catalogueItemId: 'cat-movement-vk63',
      componentName: 'TMI VK63A Meca-Quartz Movement',
      reasons: [
        'Official TMI drawing supplies the 9h, 6h and 3h register centres at 7.50mm',
        'Official post dimensions drive the three register-hand bore requirements',
        'Commercial movement, dial and hand supplier SKUs remain to be qualified'
      ]
    },
    {
      partInstanceId: 'inst-case', catalogueItemId: 'cat-case-vk63-preview',
      componentName: '42mm Chronograph Case Preview',
      reasons: [
        'Provides a visual envelope for crown and 2h/4h pushers',
        'Does not claim compatibility with the non-chronograph NMK901 case',
        'Pusher tube, stem and movement-retention interfaces require a dedicated platform drawing'
      ]
    },
    {
      partInstanceId: 'inst-dial', catalogueItemId: 'cat-dial-vk63-preview',
      componentName: 'VK63 Three-Register Dial Preview',
      reasons: [
        'Register centres follow the published VK63 drawing',
        'Recess depth, artwork diameter and printed scale geometry are estimated presentation values',
        'Final dial diameter and feet must be matched to the selected VK63 case and supplier'
      ]
    },
    {
      partInstanceId: 'inst-hands-hour', catalogueItemId: 'cat-hands-vk63-preview',
      componentName: 'VK63 Main and Register Hand Set',
      reasons: [
        'Needle, baton and syringe register silhouettes are independently configurable',
        'Published movement post dimensions are recorded while hand silhouettes remain estimated',
        'Supplier broach tolerances and axial stack clearance remain unverified'
      ]
    },
    {
      partInstanceId: 'inst-pushers', catalogueItemId: 'cat-pushers-vk63-preview',
      componentName: '2h / 4h Chronograph Pushers',
      reasons: [
        'Correctly communicates the two-actuator VK63 control layout',
        'Presentation geometry only until tube, seal and engagement drawings are supplied'
      ]
    }
  ];

  return {
    buildType,
    title: titles[buildType],
    description: descriptions[buildType],
    status: buildType === 'chronograph' ? 'PRESENTATION_ONLY' : 'VERIFIED_SPEC',
    assembly: base,
    partExplanations: buildType === 'chronograph' ? chronographPartExplanations : nh35PartExplanations
  };
};

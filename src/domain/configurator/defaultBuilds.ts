import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { applyArchetypeVisualProfile } from './archetypeProfiles';
import { applyCatalogueVisualSelection, visualVariantCatalogueItems } from '@/domain/catalogue';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';

export type StarterBuildType = 'diver' | 'pilot' | 'dress' | 'ladies-dress' | 'field' | 'chronograph';

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
    'ladies-dress': 'archetype-ladies-dress-nh05', field: 'archetype-field', chronograph: 'archetype-chronograph'
  };
  const titles: Record<StarterBuildType, string> = {
    diver: 'Dive watch baseline', pilot: 'Pilot watch baseline', dress: 'Dress watch baseline',
    'ladies-dress': 'NH05 ladies dress baseline', field: 'Field watch baseline', chronograph: 'Chronograph baseline'
  };
  const descriptions: Record<StarterBuildType, string> = {
    diver: 'High-lume dial, rotating dive bezel and high-contrast tool-watch composition.',
    pilot: 'Large Arabic markers, restrained bezel and high-legibility aviation composition.',
    dress: 'Light minimal dial, fine markers and polished formal-watch composition.',
    'ladies-dress': 'Compact 34 mm dress-watch platform using the published NH05 movement interfaces and provisional aftermarket case geometry.',
    field: 'Matte utility dial, Arabic markers and subdued outdoor color palette.',
    chronograph: 'Two-tone timing dial, tachymeter reference and chronograph movement layout.'
  };
  // A starter replaces its platform, rather than inheriting NH05/VK63 parts.
  const fresh = createDefaultWatchAssembly();
  fresh.metadata = { ...fresh.metadata, id: sourceAssembly.metadata.id, name: sourceAssembly.metadata.name,
    designer: sourceAssembly.metadata.designer, revision: sourceAssembly.metadata.revision };
  // Retain the authored 40/42 mm render frame for NH35 sources; do not carry
  // the compact ladies frame into a larger starter.
  if (sourceAssembly.metadata.movement.toLowerCase() === 'nh35') {
    fresh.globalDimensions = { ...sourceAssembly.globalDimensions };
  }
  const reviewedSource = sourceAssembly.metadata.movement.toLowerCase() === 'nh35'
    && sourceAssembly.designConfig?.visualReferenceId === 'reference-42-preview/v1'
    && buildType !== 'ladies-dress';
  let base = applyArchetypeVisualProfile(reviewedSource ? sourceAssembly : fresh, archetypeIds[buildType]);
  if (buildType === 'ladies-dress') {
    const variant = (id: string) => visualVariantCatalogueItems.find((item) => item.id === id)!;
    base = applyCatalogueVisualSelection(base, 'inst-midcase', variant('cat-case-nh05-ladies-dress-34'));
    base = applyCatalogueVisualSelection(base, 'inst-dial-blank', variant('cat-dial-nh05-245-champagne-sunburst'));
    base = applyCatalogueVisualSelection(base, 'inst-hour-hand', variant('cat-hands-nh05-dress-baton'));
    const parts = { ...base.parts };
    const midcase = parts['inst-midcase'];
    if (midcase) parts['inst-midcase'] = { ...midcase, parametricGeometry: undefined, geometryProvenance: undefined };
    for (const id of ['inst-minute-hand', 'inst-central-seconds']) {
      const part = parts[id];
      if (part) parts[id] = {
        ...part, catalogueItemId: 'cat-hands-nh05-dress-baton',
        name: id === 'inst-minute-hand' ? 'NH05 Dress Minute Hand (supplier fitting unverified)' : 'NH05 Dress Seconds Hand (supplier fitting unverified)',
        customProperties: { ...part.customProperties, engineeringSpecs: undefined },
        dimensions: { ...part.dimensions, diameterMm: id === 'inst-minute-hand' ? 8.82 : 9.5 }
      };
    }
    const strap = parts['inst-strap-integration'];
    if (strap) parts['inst-strap-integration'] = { ...strap, dimensions: { ...strap.dimensions, widthMm: 16 } };
    const crown = parts['inst-crown'];
    if (crown) parts['inst-crown'] = {
      ...crown,
      dimensions: { ...crown.dimensions, diameterMm: 5, thicknessMm: 2.5 },
      parametricGeometry: undefined,
      geometryProvenance: undefined
    };
    const crystal = parts['inst-crystal'];
    if (crystal) parts['inst-crystal'] = { ...crystal, dimensions: { ...crystal.dimensions, diameterMm: 28, widthMm: 28 } };
    const chapterRing = parts['inst-chapter-ring'];
    if (chapterRing) parts['inst-chapter-ring'] = { ...chapterRing, dimensions: { ...chapterRing.dimensions, diameterMm: 27, widthMm: 1.1 } };
    const rotatingBezel = parts['inst-rotating-bezel'];
    if (rotatingBezel) parts['inst-rotating-bezel'] = { ...rotatingBezel, visible: false };
    const fixedBezel = parts['inst-fixed-bezel'];
    if (fixedBezel) parts['inst-fixed-bezel'] = { ...fixedBezel, visible: true, dimensions: { ...fixedBezel.dimensions, diameterMm: 32 } };
    base = {
      ...base,
      metadata: { ...base.metadata, movement: 'nh05', notes: 'NH05 ladies dress preview. TMI movement interfaces published; supplier case interfaces require verification.' },
      globalDimensions: { ...base.globalDimensions, caseDiameterMm: 34, totalThicknessMm: 10.5 },
      designConfig: { ...base.designConfig, assemblyAnchors: undefined },
      parts
    };
  }
  if (buildType === 'chronograph') {
    const pushers = base.parts['inst-pushers'];
    base = {
      ...base,
      metadata: { ...base.metadata, movement: 'vk63' },
      parts: pushers
        ? { ...base.parts, 'inst-pushers': { ...pushers, visible: true } }
        : base.parts
    };
    // A newly loaded baseline owns its scale settings even when its source was
    // already a chronograph. Saved projects still hydrate their explicit choices.
    const bands = assemblyToBands(base);
    const selection = getScaleProgram('chrono', bands);
    const target = bands.find(band => band.kind === 'outer-bezel');
    base = withScaleSnapshot(base, {
      selectedScaleKind: selection.kind,
      pluginConfig: {
        ...getScalePlugin('tachymeter')!.defaultConfig,
        ...selection.config,
        placementTargetBandId: target?.id ?? 'band-outer-bezel',
        bandInnerRadiusMm: target?.geometry.innerRadius ?? 14,
        bandOuterRadiusMm: target?.geometry.outerRadius ?? 21
      },
      context: selection.context,
      previewEnabled: true,
      crossArchetypeUnlocked: false
    });
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

  const nh05PartExplanations: StarterPartExplanation[] = [
    {
      partInstanceId: 'inst-movement', catalogueItemId: 'cat-movement-nh05', componentName: 'TMI NH05B Automatic Movement',
      reasons: ['Official TMI drawing: 17.50 mm movement OD and 17.20 mm casing diameter', 'Published 5.92 mm movement height and Type M hand stack', '3H date with published 1.10/0.656/0.213 mm hand fittings']
    },
    {
      partInstanceId: 'inst-midcase', catalogueItemId: 'cat-case-nh05-ladies-dress-34', componentName: '34 mm NH05 Ladies Dress Case Preview',
      reasons: ['Matches the researched 34 mm / 24.5 mm aftermarket format', 'Case cavity, stem axis, crystal seat and gasket geometry remain supplier-unverified', 'Golden sample is required before manufacturing approval']
    },
    {
      partInstanceId: 'inst-dial-blank', catalogueItemId: 'cat-dial-nh05-245-champagne-sunburst', componentName: '24.5 mm NH05 Champagne Dress Dial',
      reasons: ['NH05-specific marketplace format', 'Uses the official 1.65 mm dial centre opening', 'Feet and 3H date aperture still require listing-specific confirmation']
    },
    {
      partInstanceId: 'inst-hour-hand', catalogueItemId: 'cat-hands-nh05-dress-baton', componentName: 'Compact NH05 Dress Baton Hand Set',
      reasons: ['Procedural lengths are constrained inside the 24.5 mm dial', 'Bore metadata follows the TMI hand-fitting drawing', 'Supplier tube heights and broach tolerances remain unverified']
    }
  ];

  return {
    buildType,
    title: titles[buildType],
    description: descriptions[buildType],
    status: 'PRESENTATION_ONLY',
    assembly: base,
    partExplanations: buildType === 'chronograph' ? chronographPartExplanations : buildType === 'ladies-dress' ? nh05PartExplanations : nh35PartExplanations
  };
};

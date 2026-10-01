import type { CatalogueManufacturingMetadata, ComponentCatalogueItem } from './types';

const cnc: CatalogueManufacturingMetadata = {
  processProfile: 'cnc',
  minimumFeatureMm: 0.2,
  minimumGapMm: 0.2,
  minimumStrokeWidthMm: 0.12,
  recommendations: ['Presentation geometry only until the supplier interface drawing is verified.']
};

const dialManufacturing: CatalogueManufacturingMetadata = {
  processProfile: 'pad-print',
  minimumFeatureMm: 0.12,
  minimumGapMm: 0.15,
  minimumStrokeWidthMm: 0.1,
  recommendations: ['Confirm dial feet, date aperture and movement compatibility before ordering.']
};

const handManufacturing: CatalogueManufacturingMetadata = {
  processProfile: 'laser',
  minimumFeatureMm: 0.12,
  minimumGapMm: 0.15,
  minimumStrokeWidthMm: 0.12,
  recommendations: ['Confirm all hand-hole diameters and total hand-stack height before ordering.']
};

/**
 * Selectable visual variants. Kept outside defaultCatalogueItems so assembly
 * creation does not instantiate every option as a physical watch part.
 */
export const visualVariantCatalogueItems: ComponentCatalogueItem[] = [
  {
    id: 'cat-case-nh05-ladies-dress-34',
    kind: 'midcase',
    displayName: '34mm NH05 Ladies Dress Case',
    category: 'case',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: null,
    nominalDimensions: { diameterMm: 34, widthMm: 34, thicknessMm: 10.5 },
    manufacturing: cnc,
    softStyles: ['ladies', 'dress', 'round', 'nh05-compatible'],
    status: 'draft',
    metadata: {
      tags: ['case', 'ladies', 'dress', '34mm', 'nh05', '24.5mm-dial'],
      revision: 'P1',
      notes: 'Procedural preview based on supplier headline dimensions. Movement holder, stem height, lug width and included parts require exact-variant confirmation.'
    },
    engineeringSpecs: {
      case: {
        cavityDiameterMm: 19.8,
        cavityDepthMm: 7.6,
        dialSeatDiameterMm: 24.5,
        crystalSeatDiameterMm: 28,
        stemPosition: '3h',
        supportedMovementIds: ['nh05', 'nh06']
      }
    },
    visual: {
      category: 'case', assetId: 'case-nh05-ladies-dress-34', representation: 'glb', status: 'provisional',
      note: 'Dedicated 34 mm presentation GLB; supplier interfaces still require exact-variant confirmation.'
    },
    exportEnabled: false
  },
  ...([
    {
      id: 'cat-case-tandorio-pilot-40', name: 'Tandorio 40mm Pilot Case', diameter: 40.2, thickness: 12.3,
      material: 'steel', texture: 'brushed', styles: ['pilot', 'tool-watch', 'nh35-compatible'],
      tags: ['case', 'pilot', '40.2mm', 'tandorio', 'dimensioned-drawing', 'nh34', 'nh35', 'nh36', 'nh38'],
      note: 'Exact Tandorio product and drawing: 40.20 mm OD, 12.30 mm thick, 20 mm lugs and 33.5–34.3 mm dial range.'
    },
    {
      id: 'cat-case-namoki-nmk920-tuna-47', name: 'namokiMODS NMK920 Tuna 47mm Case', diameter: 47, thickness: 11.3,
      material: 'steel', texture: 'brushed', styles: ['diver', 'tuna', 'oversize', 'skx-compatible'],
      tags: ['case', 'diver', '47mm', 'nmk920', 'dimensioned-drawing', 'skx007', 'srpd'],
      note: 'Exact NMK920 product and dimension drawing: 47 mm including shroud, 46.5 mm lug-to-lug, 11.3 mm without caseback and 22 mm lugs.'
    },
    {
      id: 'cat-case-feiyashi-samurai-438', name: 'FEIYASHI 43.8mm Samurai Case', diameter: 43.8, thickness: 13.65,
      material: 'steel', texture: 'brushed', styles: ['diver', 'samurai', 'nh35-compatible'],
      tags: ['case', 'diver', '43.8mm', 'feiyashi', 'dimensioned-drawing', 'nh34', 'nh35', 'nh36', 'nh38'],
      note: 'Exact active seller item and its drawing: 43.8 mm diameter, 13.65 mm thickness, 22 mm lugs and 28.5 mm dial.'
    },
    {
      id: 'cat-case-tandorio-bronze-diver-44', name: 'Tandorio CuSn8 44mm Bronze Diver Case', diameter: 44, thickness: 14,
      material: 'bronze', texture: 'brushed', styles: ['diver', 'bronze', 'turtle', 'nh35-compatible'],
      tags: ['case', 'diver', '44mm', 'tandorio', 'cusn8', 'dimensioned-drawing', 'nh34', 'nh35', 'nh36'],
      note: 'Exact Tandorio seller item and technical drawing. The recorded listing is currently out of stock; use the drawing for visual GLB development only.'
    },
    {
      id: 'cat-case-wr-skx-sandblasted-42', name: 'WR Accessories 42mm Sandblasted SKX Case', diameter: 42, thickness: 11,
      material: 'steel', texture: 'sandblasted', styles: ['diver', 'skx', 'sandblasted', 'nh35-compatible'],
      tags: ['case', 'diver', '42mm', 'wr-accessories', 'dimensioned-drawing', 'skx007', 'nh35', 'nh36'],
      note: 'Exact WR Accessories product and drawing: 42 mm diameter, 46 mm lug-to-lug, 11 mm height, 22 mm lugs, 31.5 mm crystal and documented insert/chapter-ring interfaces.'
    },
    {
      id: 'cat-case-tandorio-willard-41', name: 'Tandorio 41mm Captain Willard Case', diameter: 41, thickness: 12.7,
      material: 'steel', texture: 'polished', styles: ['diver', 'willard', 'nh35-compatible'],
      tags: ['case', 'diver', '41mm', 'tandorio', 'dimensioned-drawing', 'nh34', 'nh35', 'nh36'],
      note: 'Exact Tandorio product and drawing: 41 mm body, 48 mm lug-to-lug, 12.7 mm thick, 19 mm lugs, 28.5 mm dial and 38/31.5 mm bezel interface.'
    }
  ] as const).map((entry): ComponentCatalogueItem => ({
    id: entry.id,
    kind: 'midcase',
    displayName: entry.name,
    category: 'case',
    defaultMaterial: entry.material,
    defaultTexture: entry.texture,
    linkedBandKind: null,
    nominalDimensions: { diameterMm: entry.diameter, widthMm: entry.diameter, thicknessMm: entry.thickness },
    manufacturing: cnc,
    softStyles: [...entry.styles],
    status: 'draft',
    metadata: { tags: [...entry.tags], revision: 'P1', notes: entry.note },
    visual: {
      category: 'case', assetId: entry.id.replace('cat-', ''), representation: 'glb', status: 'provisional',
      note: 'Dedicated dimension-envelope GLB. Interface and manufacturing details remain gated by the linked drawing evidence.'
    },
    exportEnabled: false
  })),
  ...([
    ['mother-of-pearl', 'Mother-of-Pearl Diamond', 'brushed-metal'],
    ['champagne-sunburst', 'Champagne Sunburst Baton', 'sunburst'],
    ['silver-roman', 'Silver Roman Numeral', 'sunburst'],
    ['black-sunburst', 'Black Sunburst Baton', 'sunburst']
  ] as const).map(([id, label, finish]): ComponentCatalogueItem => ({
    id: `cat-dial-nh05-245-${id}`,
    kind: 'dial-blank',
    displayName: `24.5mm NH05 ${label} Dial`,
    category: 'dial',
    defaultMaterial: 'brass',
    defaultTexture: finish,
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 24.5, widthMm: 24.5, thicknessMm: 0.4 },
    manufacturing: dialManufacturing,
    softStyles: ['ladies', 'dress', id, 'nh05-compatible'],
    status: 'draft',
    metadata: {
      tags: ['dial', 'ladies', 'dress', '24.5mm', 'nh05', id],
      revision: 'P1',
      notes: 'Procedural finish preview. Confirm exact dial feet, centre hole and date aperture against the selected NH05 listing.'
    },
    engineeringSpecs: {
      dial: {
        outerDiameterMm: 24.5,
        thicknessMm: 0.4,
        centerHoleMm: 1.65,
        compatibleCalibres: ['nh05'],
        datePosition: '3:00'
      }
    },
    visual: {
      category: 'dial', assetId: `dial-nh05-${id}-245`, representation: 'glb', status: 'provisional',
      dialFinish: finish
    },
    exportEnabled: false
  })),
  {
    id: 'cat-hands-nh05-dress-baton',
    kind: 'hand-set',
    displayName: 'Compact Dress Baton Hand Set for NH05',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 9.5, widthMm: 0.55, thicknessMm: 0.55 },
    manufacturing: handManufacturing,
    softStyles: ['ladies', 'dress', 'baton', 'nh05-compatible'],
    status: 'draft',
    metadata: {
      tags: ['hands', 'ladies', 'dress', 'nh05', 'baton'],
      revision: 'P1',
      notes: 'Movement-aware procedural preview using published NH05 1.10/0.656/0.213 mm fittings. Confirm actual hand lengths, pipes and stack height from the chosen set.'
    },
    visual: {
      category: 'hands', assetId: 'hands-baton-nh05-34', representation: 'glb', status: 'provisional',
      handStyle: 'baton', note: 'Compact NH05 proportions are generated from the 24.5 mm dial; no supplier-exact GLB is claimed.'
    },
    exportEnabled: false
  },
  {
    id: 'cat-bezel-knurled-42',
    kind: 'rotating-bezel',
    displayName: '42mm Knurled Dive Bezel',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'knurled',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 41, widthMm: 4.75, thicknessMm: 2.8 },
    manufacturing: cnc,
    softStyles: ['knurled', 'diver', 'tool-watch'],
    status: 'draft',
    metadata: { tags: ['bezel', 'knurled', '42mm', 'visual-variant'], revision: 'P1', notes: 'Provisional presentation asset; supplier interface evidence is still required.' },
    visual: { category: 'bezel', assetId: 'bezel-knurled-42mm-v1', representation: 'glb', status: 'provisional', bezelProfile: 'knurled' },
    exportEnabled: false
  },
  {
    id: 'cat-dial-sunburst-blue-285',
    kind: 'dial-blank',
    displayName: '28.5mm Sunburst Blue Dial',
    category: 'dial',
    defaultMaterial: 'brass',
    defaultTexture: 'sunburst',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 28.5, widthMm: 28.5, thicknessMm: 0.4 },
    manufacturing: dialManufacturing,
    softStyles: ['sunburst', 'dress', 'nh35-compatible'],
    status: 'draft',
    metadata: { tags: ['dial', 'sunburst', 'blue', '28.5mm', 'visual-variant'], revision: 'P1', notes: 'Procedural radial finish; colour and interfaces remain independently configurable.' },
    visual: { category: 'dial', assetId: 'dial-sterile-285', representation: 'glb', status: 'provisional', dialFinish: 'sunburst', note: 'GLB substrate with runtime radial sunburst material.' },
    exportEnabled: true
  },
  {
    id: 'cat-hands-mercedes-set-nh35',
    kind: 'hand-set',
    displayName: 'Mercedes Hand Set for NH35',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 14, widthMm: 1.5, thicknessMm: 0.6 },
    manufacturing: handManufacturing,
    softStyles: ['mercedes', 'diver', 'nh35-compatible'],
    status: 'draft',
    metadata: { tags: ['hands', 'mercedes', 'nh35', 'visual-variant'], revision: 'P1', notes: 'Reviewed presentation silhouette; bore and stack evidence must come from the selected supplier listing.' },
    visual: { category: 'hands', assetId: 'hands-mercedes-42', representation: 'glb', status: 'provisional', handStyle: 'mercedes' },
    exportEnabled: false
  },
  ...([['baton', 'Baton'], ['sword', 'Sword'], ['dauphine', 'Dauphine'], ['syringe', 'Syringe'], ['cathedral', 'Cathedral'], ['pencil', 'Pencil'], ['broad-arrow', 'Broad Arrow'], ['skeleton', 'Skeleton']] as const).map(([id, label]): ComponentCatalogueItem => ({
    id: `cat-hands-${id}-set`, kind: 'hand-set', displayName: `${label} Hand Set`, category: 'hands',
    defaultMaterial: 'steel', defaultTexture: id === 'skeleton' ? 'skeletonized' : 'polished', linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 14, widthMm: 1.4, thicknessMm: 0.6 }, manufacturing: handManufacturing,
    softStyles: [id, 'visual-variant'], status: 'draft',
    metadata: { tags: ['hands', id, 'independent-glb'], revision: 'P1', notes: 'Independent presentation GLB. Confirm movement post bores, lengths and stack height for the selected supplier set.' },
    visual: { category: 'hands', assetId: `hands-${id}-42`, representation: 'glb', status: 'provisional', handStyle: id },
    exportEnabled: false
  })),
  ...([['dive-coin-edge', 'Dive Coin-Edge', 'coin-edge'], ['dive-scalloped', 'Dive Scalloped', 'scalloped'], ['pilot-smooth', 'Pilot Smooth', 'smooth'], ['dress-fluted', 'Dress Fluted', 'coin-edge'], ['tachymeter-fixed', 'Fixed Tachymeter', 'smooth'], ['gmt', 'GMT 24-Hour', 'coin-edge'], ['slide-rule', 'Slide-Rule', 'coin-edge']] as const).map(([id, label, profile]): ComponentCatalogueItem => ({
    id: `cat-bezel-${id}-42`, kind: id.includes('dive') || id === 'gmt' || id === 'slide-rule' ? 'rotating-bezel' : 'fixed-bezel',
    displayName: `42mm ${label} Bezel`, category: 'rings', defaultMaterial: 'steel', defaultTexture: profile,
    linkedBandKind: 'outer-bezel', nominalDimensions: { diameterMm: 41, widthMm: 4.75, thicknessMm: 2.8 }, manufacturing: cnc,
    softStyles: [id, 'bezel', 'visual-variant'], status: 'draft',
    metadata: { tags: ['bezel', id, '42mm', 'independent-glb'], revision: 'P1', notes: 'Independent presentation GLB with separate carrier and insert meshes; verify the selected case interface before manufacture.' },
    visual: { category: 'bezel', assetId: `bezel-${id}-42`, representation: 'glb', status: 'provisional', bezelProfile: profile },
    exportEnabled: false
  })),
  ...([['sterile', 'Sterile'], ['diver', 'Diver'], ['pilot-a', 'Pilot Type A'], ['pilot-b', 'Pilot Type B'], ['field', 'Field'], ['dress-sector', 'Dress Sector'], ['gmt', 'GMT'], ['chronograph', 'Chronograph']] as const).map(([id, label]): ComponentCatalogueItem => ({
    id: `cat-dial-${id}-285`, kind: 'dial-blank', displayName: `28.5mm ${label} Dial`, category: 'dial',
    defaultMaterial: 'brass', defaultTexture: id === 'dress-sector' ? 'sunburst' : 'matte', linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 28.5, widthMm: 28.5, thicknessMm: 0.42 }, manufacturing: dialManufacturing,
    softStyles: [id, 'dial', 'visual-variant'], status: 'draft',
    metadata: { tags: ['dial', id, '28.5mm', 'independent-glb'], revision: 'P1', notes: 'Independent presentation GLB. Confirm feet, date aperture, indices and movement clearance for the chosen physical dial.' },
    visual: { category: 'dial', assetId: `dial-${id}-285`, representation: 'glb', status: 'provisional', dialFinish: id === 'dress-sector' ? 'sunburst' : 'matte' },
    exportEnabled: false
  }))
];

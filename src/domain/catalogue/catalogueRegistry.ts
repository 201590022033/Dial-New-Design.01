import type { ComponentCatalogueItem, CatalogueManufacturingMetadata, ManufacturingProcessProfile } from './types';

const defaultManufacturing = (processProfile: ManufacturingProcessProfile): CatalogueManufacturingMetadata => ({
  processProfile,
  minimumFeatureMm: processProfile === 'cnc' ? 0.2 : 0.12,
  minimumGapMm: processProfile === 'cnc' ? 0.2 : 0.15,
  minimumStrokeWidthMm: processProfile === 'pad-print' ? 0.1 : 0.12,
  recommendations: ['Do not auto-modify geometry on export.', 'Run process profile validation before release.']
});

export const defaultCatalogueItems: ComponentCatalogueItem[] = [
  // Dial face (primary dial blank)
  {
    id: 'cat-dial-blank',
    kind: 'dial-blank',
    displayName: 'Dial Blank',
    category: 'dial',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 28.5, widthMm: 28.5, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['classic', 'universal', 'nh35-compatible'],
    status: 'verified',
    metadata: { tags: ['dial', 'blank', 'nh35'], revision: 'A', notes: 'Standard 28.5mm dial blank with dial feet for NH35/NH36' },
    exportEnabled: true
  },
  // Hands
  {
    id: 'cat-hour-hand',
    kind: 'hour-hand',
    displayName: 'Hour Hand',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 10, widthMm: 1.2, thicknessMm: 0.2 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['pilot', 'aviation', 'high-legibility'],
    status: 'verified',
    metadata: { tags: ['hands', 'hour-hand'], revision: 'A', notes: 'Hour Hand with 1.50mm collet hole' },
    exportEnabled: true
  },
  {
    id: 'cat-minute-hand',
    kind: 'minute-hand',
    displayName: 'Minute Hand',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 13.5, widthMm: 0.9, thicknessMm: 0.2 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['pilot', 'aviation', 'high-legibility'],
    status: 'verified',
    metadata: { tags: ['hands', 'minute-hand'], revision: 'A', notes: 'Minute Hand with 0.89mm collet hole' },
    exportEnabled: true
  },
  {
    id: 'cat-central-seconds',
    kind: 'central-seconds',
    displayName: 'Central Seconds',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 14, widthMm: 0.3, thicknessMm: 0.15 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['classic', 'fine-needle'],
    status: 'verified',
    metadata: { tags: ['hands', 'central-seconds'], revision: 'A', notes: 'Seconds hand with 0.21mm collet pipe' },
    exportEnabled: true
  },
  {
    id: 'cat-gmt-hand',
    kind: 'gmt-hand',
    displayName: 'GMT Hand',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 12.5, widthMm: 1.0, thicknessMm: 0.2 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['gmt', 'travel', 'arrow-tip'],
    status: 'verified',
    metadata: { tags: ['hands', 'gmt'], revision: 'A', notes: '24-hour second time-zone hand' },
    exportEnabled: true
  },
  {
    id: 'cat-chronograph-seconds',
    kind: 'chronograph-seconds',
    displayName: 'Chronograph Seconds',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 14, widthMm: 0.25, thicknessMm: 0.15 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['racing', 'sports', 'counterweight'],
    status: 'verified',
    metadata: { tags: ['hands', 'chronograph'], revision: 'A', notes: 'Central sweep chronograph seconds' },
    exportEnabled: true
  },
  // Complications
  {
    id: 'cat-counter-30m',
    kind: 'counter-30m',
    displayName: '30-minute Counter',
    category: 'complications',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 7, widthMm: 7, thicknessMm: 0.25 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['chronograph', 'racing'],
    status: 'verified',
    metadata: { tags: ['complications', 'subdial'], revision: 'A', notes: '30-minute elapsed time register' },
    exportEnabled: true
  },
  {
    id: 'cat-counter-12h',
    kind: 'counter-12h',
    displayName: '12-hour Counter',
    category: 'complications',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 7, widthMm: 7, thicknessMm: 0.25 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['chronograph', 'endurance'],
    status: 'verified',
    metadata: { tags: ['complications', 'subdial'], revision: 'A', notes: '12-hour elapsed counter register' },
    exportEnabled: true
  },
  {
    id: 'cat-running-seconds',
    kind: 'running-seconds',
    displayName: 'Running Seconds',
    category: 'complications',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 6.5, widthMm: 6.5, thicknessMm: 0.25 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['traditional', 'marine'],
    status: 'verified',
    metadata: { tags: ['complications', 'small-seconds'], revision: 'A', notes: 'Continuous running small seconds subdial' },
    exportEnabled: true
  },
  {
    id: 'cat-date-window',
    kind: 'date-window',
    displayName: 'Date Window',
    category: 'complications',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 3.5, widthMm: 2.8, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['utilitarian', 'frameless-or-beveled'],
    status: 'verified',
    metadata: { tags: ['complications', 'date'], revision: 'A', notes: '3 o clock or 4.5 o clock date aperture with bevel edge' },
    exportEnabled: true
  },
  {
    id: 'cat-day-window',
    kind: 'day-window',
    displayName: 'Day Window',
    category: 'complications',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 6, widthMm: 3, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['utilitarian', 'day-date'],
    status: 'verified',
    metadata: { tags: ['complications', 'day'], revision: 'A', notes: 'Day of week aperture' },
    exportEnabled: true
  },
  {
    id: 'cat-moonphase',
    kind: 'moonphase',
    displayName: 'Moonphase',
    category: 'complications',
    defaultMaterial: 'brass',
    defaultTexture: 'gloss',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 9, widthMm: 7, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['astronomical', 'dress', 'poetic'],
    status: 'verified',
    metadata: { tags: ['complications', 'moonphase'], revision: 'A', notes: 'Lunate aperture with starfield disc' },
    exportEnabled: true
  },
  {
    id: 'cat-power-reserve',
    kind: 'power-reserve',
    displayName: 'Power Reserve',
    category: 'complications',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 8, widthMm: 5, thicknessMm: 0.25 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['technical', 'horology'],
    status: 'verified',
    metadata: { tags: ['complications', 'power-reserve'], revision: 'A', notes: 'Spring tension indicator arc' },
    exportEnabled: true
  },
  {
    id: 'cat-open-heart',
    kind: 'open-heart',
    displayName: 'Open Heart',
    category: 'complications',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 7.5, widthMm: 7.5, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['skeleton', 'mechanical-display'],
    status: 'verified',
    metadata: { tags: ['complications', 'balance-wheel'], revision: 'A', notes: 'Circular aperture viewing balance wheel' },
    exportEnabled: true
  },
  {
    id: 'cat-tourbillon-aperture',
    kind: 'tourbillon-aperture',
    displayName: 'Tourbillon Aperture',
    category: 'complications',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'complications',
    nominalDimensions: { diameterMm: 11, widthMm: 11, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['haute-horlogerie', 'complex'],
    status: 'verified',
    metadata: { tags: ['complications', 'tourbillon'], revision: 'A', notes: '6 o clock revolving carriage window' },
    exportEnabled: true
  },
  // Indices
  {
    id: 'cat-applied-indices',
    kind: 'applied-indices',
    displayName: 'Applied Indices',
    category: 'indices',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 1.2, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['luxury', 'dress', 'faceted'],
    status: 'verified',
    metadata: { tags: ['indices', 'applied'], revision: 'A', notes: '3D faceted metallic markers with dial mounting pins' },
    exportEnabled: true
  },
  {
    id: 'cat-printed-indices',
    kind: 'printed-indices',
    displayName: 'Printed Indices',
    category: 'indices',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 0.8, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['minimalist', 'clean', 'bauhaus'],
    status: 'verified',
    metadata: { tags: ['indices', 'printed'], revision: 'A', notes: 'Flat high-contrast printed markers' },
    exportEnabled: true
  },
  {
    id: 'cat-mixed-index-sets',
    kind: 'mixed-index-sets',
    displayName: 'Mixed Index Sets',
    category: 'indices',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 1.5, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['diver', 'sport'],
    status: 'verified',
    metadata: { tags: ['indices', 'mixed'], revision: 'A', notes: 'Triangles at 12, batons at 3/6/9, dots elsewhere' },
    exportEnabled: true
  },
  {
    id: 'cat-arabic-numerals',
    kind: 'arabic-numerals',
    displayName: 'Arabic Numerals',
    category: 'indices',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 22, widthMm: 2.2, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['pilot', 'field', 'military'],
    status: 'verified',
    metadata: { tags: ['indices', 'arabic'], revision: 'A', notes: 'Full 1-12 Arabic numeral typography' },
    exportEnabled: true
  },
  {
    id: 'cat-roman-numerals',
    kind: 'roman-numerals',
    displayName: 'Roman Numerals',
    category: 'indices',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 22, widthMm: 2.5, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['classic', 'formal', 'dress'],
    status: 'verified',
    metadata: { tags: ['indices', 'roman'], revision: 'A', notes: 'Traditional I-XII Roman numerals with watchmaker IIII' },
    exportEnabled: true
  },
  {
    id: 'cat-baton-markers',
    kind: 'baton-markers',
    displayName: 'Baton Markers',
    category: 'indices',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 1.0, thicknessMm: 0.35 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['modern', 'industrial', 'streamlined'],
    status: 'verified',
    metadata: { tags: ['indices', 'baton'], revision: 'A', notes: 'Rectangular prism hour batons' },
    exportEnabled: true
  },
  {
    id: 'cat-dot-markers',
    kind: 'dot-markers',
    displayName: 'Dot Markers',
    category: 'indices',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 1.4, thicknessMm: 0.35 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['diver', 'aquatic', 'lumed'],
    status: 'verified',
    metadata: { tags: ['indices', 'dots'], revision: 'A', notes: 'Circular lumed pip indices' },
    exportEnabled: true
  },
  {
    id: 'cat-triangle-markers',
    kind: 'triangle-markers',
    displayName: 'Triangle Markers',
    category: 'indices',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'indices',
    nominalDimensions: { diameterMm: 24, widthMm: 2.4, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['aviation', 'flieger', 'navigation'],
    status: 'verified',
    metadata: { tags: ['indices', 'triangle'], revision: 'A', notes: 'Orientation triangle marker at 12 o clock' },
    exportEnabled: true
  },
  // Typography
  {
    id: 'cat-logo',
    kind: 'logo',
    displayName: 'Logo',
    category: 'typography',
    defaultMaterial: 'enamel',
    defaultTexture: 'gloss',
    linkedBandKind: 'logo',
    nominalDimensions: { diameterMm: 6, widthMm: 6, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['brand', 'identity'],
    status: 'verified',
    metadata: { tags: ['typography', 'logo'], revision: 'A', notes: 'Brand emblem below 12 o clock' },
    exportEnabled: true
  },
  {
    id: 'cat-brand-text',
    kind: 'brand-text',
    displayName: 'Brand Text',
    category: 'typography',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'text',
    nominalDimensions: { diameterMm: 12, widthMm: 12, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['brand', 'wordmark'],
    status: 'verified',
    metadata: { tags: ['typography', 'brand'], revision: 'A', notes: 'Manufacture name wordmark' },
    exportEnabled: true
  },
  {
    id: 'cat-water-resistance-text',
    kind: 'water-resistance-text',
    displayName: 'Water Resistance Text',
    category: 'typography',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'text',
    nominalDimensions: { diameterMm: 10, widthMm: 10, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['technical', 'specification'],
    status: 'verified',
    metadata: { tags: ['typography', 'spec'], revision: 'A', notes: 'Depth rating label (e.g. 200m / 660ft)' },
    exportEnabled: true
  },
  {
    id: 'cat-movement-text',
    kind: 'movement-text',
    displayName: 'Automatic / Quartz Text',
    category: 'typography',
    defaultMaterial: 'enamel',
    defaultTexture: 'matte',
    linkedBandKind: 'text',
    nominalDimensions: { diameterMm: 10, widthMm: 10, thicknessMm: 0.1 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['technical', 'spec'],
    status: 'verified',
    metadata: { tags: ['typography', 'spec'], revision: 'A', notes: 'Calibre type descriptor (e.g. AUTOMATIC 24 JEWELS)' },
    exportEnabled: true
  },
  // Rings
  {
    id: 'cat-chapter-ring',
    kind: 'chapter-ring',
    displayName: 'Chapter Ring',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'circular-brush',
    linkedBandKind: 'chapter-ring',
    nominalDimensions: { diameterMm: 30.5, widthMm: 1.8, thicknessMm: 1.5 },
    manufacturing: defaultManufacturing('engraving'),
    softStyles: ['diver', 'track', 'angled-rehaut'],
    status: 'verified',
    metadata: { tags: ['rings', 'chapter-ring'], revision: 'A', notes: 'Sloped rehaut with laser-engraved minute track' },
    exportEnabled: true
  },
  {
    id: 'cat-rehaut',
    kind: 'rehaut',
    displayName: 'Rehaut',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'sandblasted',
    linkedBandKind: 'chapter-ring',
    nominalDimensions: { diameterMm: 30.5, widthMm: 1.2, thicknessMm: 2.0 },
    manufacturing: defaultManufacturing('engraving'),
    softStyles: ['precision', 'matte'],
    status: 'verified',
    metadata: { tags: ['rings', 'rehaut'], revision: 'A', notes: 'Inner vertical case flange' },
    exportEnabled: true
  },
  {
    id: 'cat-inner-bezel',
    kind: 'inner-bezel',
    displayName: 'Inner Bezel',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'matte',
    linkedBandKind: 'inner-bezel',
    nominalDimensions: { diameterMm: 32, widthMm: 1.6, thicknessMm: 1.2 },
    manufacturing: defaultManufacturing('engraving'),
    softStyles: ['compressor', 'dual-crown'],
    status: 'verified',
    metadata: { tags: ['rings', 'inner-bezel'], revision: 'A', notes: 'Internal rotating compass or elapsed timer' },
    exportEnabled: true
  },
  {
    id: 'cat-rotating-bezel',
    kind: 'rotating-bezel',
    displayName: 'Rotating Bezel',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'matte',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 38, widthMm: 3.5, thicknessMm: 2.2 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['diver', 'unidirectional', '120-click'],
    status: 'verified',
    metadata: { tags: ['rings', 'bezel'], revision: 'A', notes: 'Unidirectional rotating bezel with ceramic/aluminum insert' },
    exportEnabled: true
  },
  {
    id: 'cat-fixed-bezel',
    kind: 'fixed-bezel',
    displayName: 'Fixed Bezel',
    category: 'rings',
    defaultMaterial: 'steel',
    defaultTexture: 'matte',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 38, widthMm: 2.8, thicknessMm: 2.0 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['dress', 'field', 'tachymeter'],
    status: 'verified',
    metadata: { tags: ['rings', 'bezel'], revision: 'A', notes: 'Fixed stationary bezel ring' },
    exportEnabled: true
  },
  // Case & Crystal
  {
    id: 'cat-crystal',
    kind: 'crystal',
    displayName: 'Crystal',
    category: 'case',
    defaultMaterial: 'sapphire',
    defaultTexture: 'clear',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 31.5, widthMm: 31.5, thicknessMm: 1.5 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['scratch-resistant', 'ar-coated'],
    status: 'verified',
    metadata: { tags: ['case', 'crystal'], revision: 'A', notes: 'Synthetic corundum watch glass with blue AR coating' },
    exportEnabled: true
  },
  {
    id: 'cat-flat-sapphire',
    kind: 'flat-sapphire',
    displayName: 'Flat Sapphire',
    category: 'case',
    defaultMaterial: 'sapphire',
    defaultTexture: 'clear',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 31.5, widthMm: 31.5, thicknessMm: 1.5 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['modern', 'flush'],
    status: 'verified',
    metadata: { tags: ['case', 'crystal'], revision: 'A', notes: 'Flat profile sapphire crystal' },
    exportEnabled: true
  },
  {
    id: 'cat-domed-sapphire',
    kind: 'domed-sapphire',
    displayName: 'Domed Sapphire',
    category: 'case',
    defaultMaterial: 'sapphire',
    defaultTexture: 'clear',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 31.5, widthMm: 31.5, thicknessMm: 2.5 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['vintage', 'bubble-effect'],
    status: 'verified',
    metadata: { tags: ['case', 'crystal'], revision: 'A', notes: 'Single domed crystal with optical magnification' },
    exportEnabled: true
  },
  {
    id: 'cat-double-domed-sapphire',
    kind: 'double-domed-sapphire',
    displayName: 'Double Domed Sapphire',
    category: 'case',
    defaultMaterial: 'sapphire',
    defaultTexture: 'clear',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 31.5, widthMm: 31.5, thicknessMm: 2.8 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['diver', 'distortion-free'],
    status: 'verified',
    metadata: { tags: ['case', 'crystal'], revision: 'A', notes: 'Convex top with matched concave bottom for zero optical distortion' },
    exportEnabled: true
  },
  {
    id: 'cat-caseback',
    kind: 'caseback',
    displayName: 'Caseback',
    category: 'case',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 35, widthMm: 35, thicknessMm: 1.8 },
    manufacturing: defaultManufacturing('engraving'),
    softStyles: ['threaded', 'screw-down', 'water-tight'],
    status: 'verified',
    metadata: { tags: ['case', 'caseback'], revision: 'A', notes: 'Screw-in solid stainless steel caseback' },
    exportEnabled: true
  },
  {
    id: 'cat-lugs',
    kind: 'lugs',
    displayName: 'Lugs',
    category: 'case',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 48, widthMm: 20, thicknessMm: 4.5 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['curved', 'drilled-holes', '20mm-spacing'],
    status: 'verified',
    metadata: { tags: ['case', 'lugs'], revision: 'A', notes: '20mm lug width geometry' },
    exportEnabled: true
  },
  // External
  {
    id: 'cat-crown',
    kind: 'crown',
    displayName: 'Crown',
    category: 'external',
    defaultMaterial: 'steel',
    defaultTexture: 'knurled',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 6.5, widthMm: 4.0, thicknessMm: 3.5 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['screw-down', 'fluted', 'gasketed'],
    status: 'verified',
    metadata: { tags: ['external', 'crown'], revision: 'A', notes: 'Winding crown with double O-ring seal' },
    exportEnabled: true
  },
  {
    id: 'cat-pushers',
    kind: 'pushers',
    displayName: 'Pushers',
    category: 'external',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 4.5, widthMm: 3.5, thicknessMm: 3.0 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['chronograph', 'pump'],
    status: 'verified',
    metadata: { tags: ['external', 'pushers'], revision: 'A', notes: 'Start/stop and reset chronograph buttons' },
    exportEnabled: true
  },
  {
    id: 'cat-helium-valve',
    kind: 'helium-valve',
    displayName: 'Helium Valve (future)',
    category: 'external',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 4.0, widthMm: 3.0, thicknessMm: 2.5 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['deep-dive', 'saturation'],
    status: 'verified',
    metadata: { tags: ['external', 'helium-escape'], revision: 'A', notes: 'Automatic de-saturation escape valve' },
    exportEnabled: true
  },
  {
    id: 'cat-strap-integration',
    kind: 'strap-integration',
    displayName: 'Strap Integration',
    category: 'external',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 20, widthMm: 20, thicknessMm: 3.0 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['leather', 'rubber', 'nato'],
    status: 'verified',
    metadata: { tags: ['external', 'strap'], revision: 'A', notes: 'Standard spring bar strap interface' },
    exportEnabled: true
  },
  {
    id: 'cat-bracelet-integration',
    kind: 'bracelet-integration',
    displayName: 'Bracelet Integration',
    category: 'external',
    defaultMaterial: 'steel',
    defaultTexture: 'satin',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 20, widthMm: 20, thicknessMm: 3.5 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['oyster', 'jubilee', 'solid-end-links'],
    status: 'verified',
    metadata: { tags: ['external', 'bracelet'], revision: 'A', notes: 'Milled solid end-link bracelet interface' },
    exportEnabled: true
  }
];

// Phase 5 Physical Compatibility Candidate Fixtures
export const compatibilityFixtureCatalogueItems: ComponentCatalogueItem[] = [
  {
    id: 'cat-eta2824-seconds-hand',
    kind: 'seconds-hand-2824',
    displayName: 'ETA 2824 Sweep Seconds',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'polished',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 13.5, widthMm: 0.25, thicknessMm: 0.15 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['swiss', 'precision'],
    status: 'verified',
    metadata: { tags: ['hands', 'eta-2824', 'seconds'], revision: 'A', notes: 'Seconds hand with 0.25mm collet pipe for ETA 2824' },
    engineeringSpecs: {
      hands: {
        colletDiameterMm: 0.25,
        lengthMm: 13.5,
        compatibleCalibres: ['eta-2824', 'eta-2892', 'sw200']
      }
    },
    exportEnabled: true
  },
  {
    id: 'cat-dial-oversized',
    kind: 'dial-oversized',
    displayName: 'Oversized Marine Dial (31.0mm)',
    category: 'dial',
    defaultMaterial: 'brass',
    defaultTexture: 'matte',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 31.0, widthMm: 31.0, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['marine', 'deck-watch'],
    status: 'verified',
    metadata: { tags: ['dial', 'oversized'], revision: 'A', notes: '31.0mm dial for 42mm+ cases' },
    engineeringSpecs: {
      dial: {
        outerDiameterMm: 31.0,
        thicknessMm: 0.4,
        compatibleCalibres: ['nh35', 'nh36']
      }
    },
    exportEnabled: true
  },
  {
    id: 'cat-dial-mod-removable-feet',
    kind: 'dial-removable-feet',
    displayName: 'Multi-Calibre Dial with Removable Feet',
    category: 'dial',
    defaultMaterial: 'brass',
    defaultTexture: 'sunburst',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 28.5, widthMm: 28.5, thicknessMm: 0.4 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['modding', 'custom'],
    status: 'verified',
    metadata: { tags: ['dial', 'removable-feet', 'mod'], revision: 'A', notes: 'Dial with removable feet for ETA 2824 / NH35' },
    engineeringSpecs: {
      dial: {
        outerDiameterMm: 28.5,
        thicknessMm: 0.4,
        compatibleCalibres: ['eta-2824'],
        hasRemovableFeet: true
      }
    },
    exportEnabled: true
  },
  {
    id: 'cat-bezel-insert-matched',
    kind: 'bezel-insert-matched',
    displayName: 'Ceramic Bezel Insert (38.0 / 31.0)',
    category: 'rings',
    defaultMaterial: 'ceramic',
    defaultTexture: 'gloss',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 38.0, widthMm: 3.5, thicknessMm: 1.0 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['diver', 'ceramic'],
    status: 'verified',
    metadata: { tags: ['bezel', 'insert', 'ceramic'], revision: 'A', notes: 'Sloped ceramic insert (31.0mm ID, 38.0mm OD)' },
    engineeringSpecs: {
      bezelInsert: {
        innerDiameterMm: 31.0,
        outerDiameterMm: 38.0,
        thicknessMm: 1.0
      }
    },
    exportEnabled: true
  },
  {
    id: 'cat-bezel-insert-mismatched',
    kind: 'bezel-insert-mismatched',
    displayName: 'Oversized Bezel Insert (40.0 / 32.0)',
    category: 'rings',
    defaultMaterial: 'aluminum',
    defaultTexture: 'matte',
    linkedBandKind: 'outer-bezel',
    nominalDimensions: { diameterMm: 40.0, widthMm: 4.0, thicknessMm: 0.8 },
    manufacturing: defaultManufacturing('pad-print'),
    softStyles: ['submariner', 'vintage'],
    status: 'verified',
    metadata: { tags: ['bezel', 'insert', 'oversized'], revision: 'A', notes: '40.0mm OD insert for large dive watches' },
    engineeringSpecs: {
      bezelInsert: {
        innerDiameterMm: 32.0,
        outerDiameterMm: 40.0,
        thicknessMm: 0.8
      }
    },
    exportEnabled: true
  },
  {
    id: 'cat-hand-ai-extracted',
    kind: 'hour-hand-draft',
    displayName: 'AI Extracted Cathedral Hour Hand',
    category: 'hands',
    defaultMaterial: 'steel',
    defaultTexture: 'brushed',
    linkedBandKind: 'hands',
    nominalDimensions: { diameterMm: 10, widthMm: 1.5, thicknessMm: 0.2 },
    manufacturing: defaultManufacturing('laser'),
    softStyles: ['cathedral', 'field'],
    status: 'ai-extracted',
    metadata: { tags: ['hands', 'ai-extracted'], revision: 'draft', notes: 'Extracted from supplier web image, unverified dimensions' },
    engineeringSpecs: {
      hands: {
        colletDiameterMm: 1.50,
        lengthMm: 10
      }
    },
    exportEnabled: false
  },
  {
    id: 'cat-movement-pocket-6497',
    kind: 'movement-pocket-6497',
    displayName: 'ETA/Unitas 6497-1 Manual Calibre',
    category: 'case',
    defaultMaterial: 'brass',
    defaultTexture: 'circular-brush',
    linkedBandKind: 'dial-face',
    nominalDimensions: { diameterMm: 36.6, widthMm: 36.6, thicknessMm: 4.5 },
    manufacturing: defaultManufacturing('cnc'),
    softStyles: ['pocket-watch', 'manual-wind'],
    status: 'verified',
    metadata: { tags: ['movement', '6497', 'unitas'], revision: 'A', notes: 'Large 36.6mm manual wind pocket watch calibre' },
    engineeringSpecs: {
      movement: {
        calibreId: 'unitas-6497',
        diameterMm: 36.6,
        heightMm: 4.5,
        stemPosition: '3h',
        handSizesMm: { hour: 2.0, minute: 1.15, second: 0.27 }
      }
    },
    exportEnabled: true
  }
];

export const catalogueItemById = new Map<string, ComponentCatalogueItem>([
  ...defaultCatalogueItems.map((item) => [item.id, item] as [string, ComponentCatalogueItem]),
  ...compatibilityFixtureCatalogueItems.map((item) => [item.id, item] as [string, ComponentCatalogueItem])
]);

export const catalogueItemByKind = new Map<string, ComponentCatalogueItem>([
  ...defaultCatalogueItems.map((item) => [item.kind, item] as [string, ComponentCatalogueItem]),
  ...compatibilityFixtureCatalogueItems.map((item) => [item.kind, item] as [string, ComponentCatalogueItem])
]);

export const registerCatalogueItem = (item: ComponentCatalogueItem): void => {
  catalogueItemById.set(item.id, item);
  catalogueItemByKind.set(item.kind, item);
};

export const getCatalogueItem = (id: string): ComponentCatalogueItem | undefined => {
  return catalogueItemById.get(id);
};

export const getCatalogueItemByKind = (kind: string): ComponentCatalogueItem | undefined => {
  return catalogueItemByKind.get(kind);
};

export const listCatalogueItems = (): ComponentCatalogueItem[] => {
  return Array.from(catalogueItemById.values());
};

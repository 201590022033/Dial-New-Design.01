import type { WatchComponentDefinition, WatchComponentKind } from '@/domain/watch-components/types';

const def = (
  kind: WatchComponentKind,
  displayName: string,
  category: WatchComponentDefinition['category'],
  linkedBandKind: WatchComponentDefinition['linkedBandKind'],
  defaultMaterial: string,
  defaultTexture: string,
  processHint: string
): WatchComponentDefinition => ({
  kind,
  displayName,
  category,
  inspectorSchemaId: `watch-${kind}`,
  linkedBandKind,
  defaultMaterial,
  defaultTexture,
  exportEnabled: true,
  pluginCompatibility: ['geometry-engine', 'renderer', 'validation-engine', 'export-engine', processHint]
});

export const watchComponentDefinitions: WatchComponentDefinition[] = [
  def('hour-hand', 'Hour Hand', 'hands', 'hands', 'steel', 'brushed', 'laser'),
  def('minute-hand', 'Minute Hand', 'hands', 'hands', 'steel', 'brushed', 'laser'),
  def('central-seconds', 'Central Seconds', 'hands', 'hands', 'steel', 'polished', 'laser'),
  def('gmt-hand', 'GMT Hand', 'hands', 'hands', 'steel', 'polished', 'laser'),
  def('chronograph-seconds', 'Chronograph Seconds', 'hands', 'hands', 'steel', 'polished', 'laser'),
  def('counter-30m', '30-minute Counter', 'complications', 'complications', 'brass', 'matte', 'pad-print'),
  def('counter-12h', '12-hour Counter', 'complications', 'complications', 'brass', 'matte', 'pad-print'),
  def('running-seconds', 'Running Seconds', 'complications', 'complications', 'brass', 'matte', 'pad-print'),
  def('applied-indices', 'Applied Indices', 'indices', 'indices', 'steel', 'polished', 'cnc'),
  def('printed-indices', 'Printed Indices', 'indices', 'indices', 'enamel', 'matte', 'pad-print'),
  def('mixed-index-sets', 'Mixed Index Sets', 'indices', 'indices', 'steel', 'polished', 'cnc'),
  def('arabic-numerals', 'Arabic Numerals', 'indices', 'indices', 'enamel', 'matte', 'pad-print'),
  def('roman-numerals', 'Roman Numerals', 'indices', 'indices', 'enamel', 'matte', 'pad-print'),
  def('baton-markers', 'Baton Markers', 'indices', 'indices', 'steel', 'brushed', 'cnc'),
  def('dot-markers', 'Dot Markers', 'indices', 'indices', 'steel', 'brushed', 'cnc'),
  def('triangle-markers', 'Triangle Markers', 'indices', 'indices', 'steel', 'brushed', 'cnc'),
  def('logo', 'Logo', 'typography', 'logo', 'enamel', 'gloss', 'pad-print'),
  def('brand-text', 'Brand Text', 'typography', 'text', 'enamel', 'matte', 'pad-print'),
  def('water-resistance-text', 'Water Resistance Text', 'typography', 'text', 'enamel', 'matte', 'pad-print'),
  def('movement-text', 'Automatic / Quartz Text', 'typography', 'text', 'enamel', 'matte', 'pad-print'),
  def('date-window', 'Date Window', 'complications', 'complications', 'steel', 'satin', 'cnc'),
  def('day-window', 'Day Window', 'complications', 'complications', 'steel', 'satin', 'cnc'),
  def('moonphase', 'Moonphase', 'complications', 'complications', 'brass', 'gloss', 'pad-print'),
  def('power-reserve', 'Power Reserve', 'complications', 'complications', 'brass', 'matte', 'pad-print'),
  def('open-heart', 'Open Heart', 'complications', 'complications', 'steel', 'satin', 'cnc'),
  def('tourbillon-aperture', 'Tourbillon Aperture', 'complications', 'complications', 'steel', 'satin', 'cnc'),
  def('chapter-ring', 'Chapter Ring', 'rings', 'chapter-ring', 'steel', 'circular-brush', 'engraving'),
  def('rehaut', 'Rehaut', 'rings', 'chapter-ring', 'steel', 'sandblasted', 'engraving'),
  def('inner-bezel', 'Inner Bezel', 'rings', 'inner-bezel', 'steel', 'matte', 'engraving'),
  def('rotating-bezel', 'Rotating Bezel', 'rings', 'outer-bezel', 'steel', 'matte', 'cnc'),
  def('fixed-bezel', 'Fixed Bezel', 'rings', 'outer-bezel', 'steel', 'matte', 'cnc'),
  def('crystal', 'Crystal', 'case', 'dial-face', 'sapphire', 'clear', 'none'),
  def('flat-sapphire', 'Flat Sapphire', 'case', 'dial-face', 'sapphire', 'clear', 'none'),
  def('domed-sapphire', 'Domed Sapphire', 'case', 'dial-face', 'sapphire', 'clear', 'none'),
  def('double-domed-sapphire', 'Double Domed Sapphire', 'case', 'dial-face', 'sapphire', 'clear', 'none'),
  def('crown', 'Crown', 'external', 'outer-bezel', 'steel', 'knurled', 'cnc'),
  def('pushers', 'Pushers', 'external', 'outer-bezel', 'steel', 'polished', 'cnc'),
  def('helium-valve', 'Helium Valve (future)', 'external', 'outer-bezel', 'steel', 'polished', 'cnc'),
  def('caseback', 'Caseback', 'case', 'outer-bezel', 'steel', 'brushed', 'engraving'),
  def('lugs', 'Lugs', 'case', 'outer-bezel', 'steel', 'brushed', 'cnc'),
  def('strap-integration', 'Strap Integration', 'external', 'outer-bezel', 'steel', 'satin', 'cnc'),
  def('bracelet-integration', 'Bracelet Integration', 'external', 'outer-bezel', 'steel', 'satin', 'cnc')
];

export const watchComponentDefinitionByKind = new Map(
  watchComponentDefinitions.map((definition) => [definition.kind, definition])
);

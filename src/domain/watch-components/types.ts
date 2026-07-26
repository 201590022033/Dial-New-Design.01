export type WatchComponentKind =
  | 'hour-hand'
  | 'minute-hand'
  | 'central-seconds'
  | 'gmt-hand'
  | 'chronograph-seconds'
  | 'counter-30m'
  | 'counter-12h'
  | 'running-seconds'
  | 'applied-indices'
  | 'printed-indices'
  | 'mixed-index-sets'
  | 'arabic-numerals'
  | 'roman-numerals'
  | 'baton-markers'
  | 'dot-markers'
  | 'triangle-markers'
  | 'logo'
  | 'brand-text'
  | 'water-resistance-text'
  | 'movement-text'
  | 'date-window'
  | 'day-window'
  | 'moonphase'
  | 'power-reserve'
  | 'open-heart'
  | 'tourbillon-aperture'
  | 'chapter-ring'
  | 'rehaut'
  | 'inner-bezel'
  | 'rotating-bezel'
  | 'fixed-bezel'
  | 'crystal'
  | 'flat-sapphire'
  | 'domed-sapphire'
  | 'double-domed-sapphire'
  | 'crown'
  | 'pushers'
  | 'helium-valve'
  | 'caseback'
  | 'lugs'
  | 'strap-integration'
  | 'bracelet-integration';

export type WatchComponentCategory =
  | 'hands'
  | 'indices'
  | 'typography'
  | 'complications'
  | 'rings'
  | 'case'
  | 'external';

export interface WatchComponentValidation {
  valid: boolean;
  warnings: string[];
}

export interface WatchManufacturingMetadata {
  processProfile:
    | 'laser'
    | 'pad-print'
    | 'uv-print'
    | 'cnc'
    | 'engraving'
    | 'etching'
    | 'photochemical';
  minimumFeatureMm: number;
  minimumGapMm: number;
  minimumStrokeWidthMm: number;
  recommendations: string[];
}

export interface WatchComponentDefinition {
  kind: WatchComponentKind;
  displayName: string;
  category: WatchComponentCategory;
  inspectorSchemaId: string;
  linkedBandKind:
    | 'dial-face'
    | 'chapter-ring'
    | 'inner-bezel'
    | 'outer-bezel'
    | 'movement-template'
    | 'scale-generator'
    | 'hands'
    | 'indices'
    | 'text'
    | 'logo'
    | 'complications'
    | null;
  defaultMaterial: string;
  defaultTexture: string;
  exportEnabled: boolean;
  pluginCompatibility: string[];
}

export interface WatchComponentEntity {
  id: string;
  definition: WatchComponentDefinition;
  visible: boolean;
  locked: boolean;
  highlighted: boolean;
  material: string;
  color: string;
  texture: string;
  dimensions: {
    diameterMm: number;
    widthMm: number;
    thicknessMm: number;
    offsetXmm: number;
    offsetYmm: number;
  };
  typography: {
    fontFamily: string;
    fontSizeMm: number;
    tracking: number;
  };
  manufacturing: WatchManufacturingMetadata;
  validation: WatchComponentValidation;
  metadata: {
    tags: string[];
    revision: string;
    notes: string;
  };
  exportEnabled: boolean;
}

import type { EngineeringProfileKind, FormatterKind, ProjectionKind, ScalePluginConfig } from '@/domain/scales/types';

export interface ManufacturingRecommendation {
  minimumRingWidthMm: number;
  minimumPrintableFontMm: number;
  recommendedEngravingDepthMm: number;
  recommendedLaserDensity: number;
  recommendedUvSpacingMm: number;
  recommendedCncSpacingMm: number;
  recommendedPadPrintSpacingMm: number;
}

export interface EngineeringProfileDefinition {
  id: EngineeringProfileKind;
  purpose: string;
  projection: ProjectionKind;
  formatter: FormatterKind;
  defaultDensity: NonNullable<ScalePluginConfig['tickDensityProfile']>;
  defaultTypography: string;
  defaultTickStrategy: string;
  defaultLabelStrategy: string;
  manufacturingClass: 'precision' | 'industrial' | 'aviation' | 'scientific' | 'general';
  compatibleRings: string[];
  typicalApplications: string[];
  defaults: Partial<ScalePluginConfig>;
  manufacturingRecommendation: ManufacturingRecommendation;
}

interface ApplyProfileOptions {
  overrideExisting?: boolean;
  preserveProjection?: boolean;
}

const makeRecommendation = (
  minimumRingWidthMm: number,
  minimumPrintableFontMm: number,
  recommendedEngravingDepthMm: number,
  recommendedLaserDensity: number,
  recommendedUvSpacingMm: number,
  recommendedCncSpacingMm: number,
  recommendedPadPrintSpacingMm: number
): ManufacturingRecommendation => ({
  minimumRingWidthMm,
  minimumPrintableFontMm,
  recommendedEngravingDepthMm,
  recommendedLaserDensity,
  recommendedUvSpacingMm,
  recommendedCncSpacingMm,
  recommendedPadPrintSpacingMm
});

const precisionRecommendation = makeRecommendation(1.8, 0.55, 0.09, 0.78, 0.16, 0.14, 0.18);
const scientificRecommendation = makeRecommendation(2.0, 0.6, 0.1, 0.8, 0.18, 0.16, 0.2);
const aviationRecommendation = makeRecommendation(2.3, 0.68, 0.12, 0.86, 0.2, 0.18, 0.22);
const industrialRecommendation = makeRecommendation(2.2, 0.65, 0.11, 0.82, 0.2, 0.18, 0.21);
const generalRecommendation = makeRecommendation(1.9, 0.58, 0.1, 0.76, 0.17, 0.15, 0.19);

const profileTable: Record<EngineeringProfileKind, EngineeringProfileDefinition> = {
  C: {
    id: 'C',
    purpose: 'Primary multiplication and ratio ring.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'balanced',
    defaultTypography: 'technical mono condensed',
    defaultTickStrategy: 'one decade with secondary subdivisions',
    defaultLabelStrategy: 'mantissa majors with optional secondary labels',
    manufacturingClass: 'precision',
    compatibleRings: ['outer'],
    typicalApplications: ['multiplication', 'ratio reading', 'engineering estimation'],
    defaults: {
      logarithmicDecades: 1,
      logarithmicRingType: 'C',
      includeMinorLabels: true,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: precisionRecommendation
  },
  D: {
    id: 'D',
    purpose: 'Companion logarithmic multiplication ring.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'balanced',
    defaultTypography: 'technical mono condensed',
    defaultTickStrategy: 'one decade with secondary subdivisions',
    defaultLabelStrategy: 'mantissa majors with optional secondary labels',
    manufacturingClass: 'precision',
    compatibleRings: ['inner', 'outer'],
    typicalApplications: ['division companion', 'ratio alignment', 'circular slide rule'],
    defaults: {
      logarithmicDecades: 1,
      logarithmicRingType: 'D',
      includeMinorLabels: true,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: precisionRecommendation
  },
  CI: {
    id: 'CI',
    purpose: 'Reciprocal companion scale for inverse operations.',
    projection: 'reciprocal-logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'balanced',
    defaultTypography: 'technical mono condensed',
    defaultTickStrategy: 'reciprocal decade with dense secondary ticks',
    defaultLabelStrategy: 'mantissa-focused reciprocal labels',
    manufacturingClass: 'precision',
    compatibleRings: ['inner', 'outer'],
    typicalApplications: ['reciprocal multiplication', 'inverse ratio solving', 'division shortcuts'],
    defaults: {
      logarithmicDecades: 1,
      logarithmicRingType: 'CI',
      includeMinorLabels: true,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: precisionRecommendation
  },
  A: {
    id: 'A',
    purpose: 'Two-decade logarithmic profile for square relationships.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'dense',
    defaultTypography: 'technical mono compact',
    defaultTickStrategy: 'two-decade major/minor subdivisions',
    defaultLabelStrategy: 'mantissa labels every major interval',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer'],
    typicalApplications: ['square roots', 'area scaling', 'power-law estimation'],
    defaults: {
      logarithmicDecades: 2,
      logarithmicRingType: 'A',
      includeMinorLabels: true,
      tickDensityProfile: 'dense'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  B: {
    id: 'B',
    purpose: 'Two-decade companion for A-scale operations.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'dense',
    defaultTypography: 'technical mono compact',
    defaultTickStrategy: 'two-decade major/minor subdivisions',
    defaultLabelStrategy: 'mantissa labels every major interval',
    manufacturingClass: 'scientific',
    compatibleRings: ['inner'],
    typicalApplications: ['square relation companion', 'multi-ring power operations'],
    defaults: {
      logarithmicDecades: 2,
      logarithmicRingType: 'B',
      includeMinorLabels: true,
      tickDensityProfile: 'dense'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  K: {
    id: 'K',
    purpose: 'Three-decade logarithmic profile for cubic relationships.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'engineering',
    defaultTypography: 'technical mono compact',
    defaultTickStrategy: 'three-decade sparse major labeling',
    defaultLabelStrategy: 'major labels only for readability',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer'],
    typicalApplications: ['cube roots', 'volume estimation', 'density scaling'],
    defaults: {
      logarithmicDecades: 3,
      logarithmicRingType: 'K',
      includeMinorLabels: false,
      tickDensityProfile: 'engineering'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  L: {
    id: 'L',
    purpose: 'Linearized logarithmic display profile.',
    projection: 'natural-log',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'scientific sans',
    defaultTickStrategy: 'uniform log-domain segmentation',
    defaultLabelStrategy: 'scientific-value labels',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['log reading', 'exponential computation support'],
    defaults: {
      logarithmicRingType: 'L',
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  LL0: {
    id: 'LL0',
    purpose: 'Low-range log-log exponential profile.',
    projection: 'log-log',
    formatter: 'scientific',
    defaultDensity: 'dense',
    defaultTypography: 'scientific condensed',
    defaultTickStrategy: 'tight log-log segmentation for low exponent ranges',
    defaultLabelStrategy: 'scientific labels with dense majors',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer'],
    typicalApplications: ['exponential decay', 'small growth factors'],
    defaults: {
      logarithmicRingType: 'LL',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  LL1: {
    id: 'LL1',
    purpose: 'Primary log-log profile for moderate exponential ranges.',
    projection: 'log-log',
    formatter: 'scientific',
    defaultDensity: 'dense',
    defaultTypography: 'scientific condensed',
    defaultTickStrategy: 'dense log-log segmentation',
    defaultLabelStrategy: 'scientific labels with dense majors',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['compound growth', 'interest factors', 'power curves'],
    defaults: {
      logarithmicRingType: 'LL',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  LL2: {
    id: 'LL2',
    purpose: 'Mid-high log-log profile for wider exponential ranges.',
    projection: 'log-log',
    formatter: 'scientific',
    defaultDensity: 'dense',
    defaultTypography: 'scientific condensed',
    defaultTickStrategy: 'balanced log-log segmentation with protected major gaps',
    defaultLabelStrategy: 'scientific labels with selective secondary labels',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['growth modeling', 'engineering exponentials'],
    defaults: {
      logarithmicRingType: 'LL',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  LL3: {
    id: 'LL3',
    purpose: 'High-range log-log profile for aggressive exponential domains.',
    projection: 'log-log',
    formatter: 'scientific',
    defaultDensity: 'engineering',
    defaultTypography: 'scientific compact',
    defaultTickStrategy: 'major-preserving log-log segmentation',
    defaultLabelStrategy: 'major scientific labels for readability',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer'],
    typicalApplications: ['high exponent growth', 'advanced scientific planning'],
    defaults: {
      logarithmicRingType: 'LL',
      includeMinorLabels: false,
      tickDensityProfile: 'engineering',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  'fuel-consumption': {
    id: 'fuel-consumption',
    purpose: 'Aviation fuel consumption planning profile.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'dense aviation ring segmentation',
    defaultLabelStrategy: 'mantissa labels plus selected minor labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['fuel planning', 'endurance estimation'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'distance-planning': {
    id: 'distance-planning',
    purpose: 'Distance and time planning profile for flight legs.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'flight-leg focused dense segmentation',
    defaultLabelStrategy: 'mantissa major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['distance over time', 'enroute planning'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'ground-speed': {
    id: 'ground-speed',
    purpose: 'Ground speed computation profile.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'dense',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'dense with major emphasis near common cruise values',
    defaultLabelStrategy: 'mantissa major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['ground speed', 'ETA computations'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'true-air-speed': {
    id: 'true-air-speed',
    purpose: 'True air speed planning profile.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'dense',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'dense high-speed segment bias',
    defaultLabelStrategy: 'mantissa major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['TAS correction', 'performance planning'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  time: {
    id: 'time',
    purpose: 'Flight time and elapsed-time conversion profile.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'balanced',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'balanced decade segmentation',
    defaultLabelStrategy: 'major minute/hour labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['time conversion', 'elapsed planning'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  climb: {
    id: 'climb',
    purpose: 'Climb planning and gradient estimation profile.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'balanced with gradient major emphasis',
    defaultLabelStrategy: 'scientific value labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['climb planning', 'gradient estimation'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: false,
      tickDensityProfile: 'balanced',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'scientific'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  descent: {
    id: 'descent',
    purpose: 'Descent planning and profile management.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'balanced descent range emphasis',
    defaultLabelStrategy: 'scientific value labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['descent planning', 'energy management'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: false,
      tickDensityProfile: 'balanced',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'scientific'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'rate-of-climb': {
    id: 'rate-of-climb',
    purpose: 'Rate-of-climb specific profile.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'dense',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'dense with high-gradient subdivisions',
    defaultLabelStrategy: 'scientific major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer'],
    typicalApplications: ['VSI planning', 'climb rate checks'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'scientific'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'wind-correction': {
    id: 'wind-correction',
    purpose: 'Wind correction and drift profile.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'dense angular/ratio subdivisions',
    defaultLabelStrategy: 'mantissa labels with secondary support',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['drift correction', 'wind triangle approximations'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  conversion: {
    id: 'conversion',
    purpose: 'General conversion profile for mixed aviation units.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform conversion spacing',
    defaultLabelStrategy: 'decimal paired labels',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer'],
    typicalApplications: ['unit conversion', 'quick reference checks'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  'unit-conversion': {
    id: 'unit-conversion',
    purpose: 'Dedicated unit conversion profile with compact labels.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform conversion spacing',
    defaultLabelStrategy: 'compact decimal labels',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer'],
    typicalApplications: ['metric-imperial conversion', 'mixed engineering units'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  'fuel-burn': {
    id: 'fuel-burn',
    purpose: 'Fuel burn projection profile for endurance checks.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'dense with fuel-flow major anchors',
    defaultLabelStrategy: 'mantissa majors with selective minor labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['burn-rate planning', 'reserves estimation'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'holding-pattern': {
    id: 'holding-pattern',
    purpose: 'Holding pattern and timing profile.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'balanced',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'balanced with timing-focused majors',
    defaultLabelStrategy: 'timing-readable major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['holding entries', 'timed turns'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'glide-ratio': {
    id: 'glide-ratio',
    purpose: 'Glide ratio and glide distance planning profile.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'balanced with ratio major anchors',
    defaultLabelStrategy: 'scientific major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['glide planning', 'emergency descent planning'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: false,
      tickDensityProfile: 'balanced',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'scientific'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  'cross-country-planning': {
    id: 'cross-country-planning',
    purpose: 'Cross-country planning profile for multi-leg computations.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'dense with waypoint planning anchors',
    defaultLabelStrategy: 'mantissa labels with sparse secondary labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['navigation planning', 'time/fuel balancing'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  navitimer: {
    id: 'navitimer',
    purpose: 'General aviation slide-rule profile family baseline.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'dense',
    defaultTypography: 'aviation stencil sans',
    defaultTickStrategy: 'dense multi-purpose aviation segmentation',
    defaultLabelStrategy: 'mantissa major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['aviation calculations', 'general E6B style use'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'navitimer-geometry',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  aviation: {
    id: 'aviation',
    purpose: 'General aviation engineering profile.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'dense',
    defaultTypography: 'aviation technical sans',
    defaultTickStrategy: 'dense flight operation segmentation',
    defaultLabelStrategy: 'mantissa major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['flight planning', 'performance calculations'],
    defaults: {
      logarithmicRingType: 'aviation',
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      engineeringPreset: 'aviation-slide-rule'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  scientific: {
    id: 'scientific',
    purpose: 'Scientific readability profile.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'scientific sans',
    defaultTickStrategy: 'balanced with major-focused spacing',
    defaultLabelStrategy: 'scientific value labels',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['lab calculations', 'scientific instrumentation'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  engineering: {
    id: 'engineering',
    purpose: 'General engineering profile for practical readability.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'engineering',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'engineering density with manufacturing safety margins',
    defaultLabelStrategy: 'value labels with controlled precision',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['mechanical engineering', 'field instrumentation'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'engineering',
      logarithmicDisplayFormat: 'engineering'
    },
    manufacturingRecommendation: generalRecommendation
  },
  navigation: {
    id: 'navigation',
    purpose: 'Navigation-oriented profile with clear cardinal readability.',
    projection: 'logarithmic',
    formatter: 'navitimer',
    defaultDensity: 'balanced',
    defaultTypography: 'navigation sans',
    defaultTickStrategy: 'balanced with cardinal/major anchors',
    defaultLabelStrategy: 'navigation-friendly major labels',
    manufacturingClass: 'aviation',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['heading planning', 'navigation estimation'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      logarithmicDisplayFormat: 'navitimer'
    },
    manufacturingRecommendation: aviationRecommendation
  },
  physics: {
    id: 'physics',
    purpose: 'Physics computation profile with scientific notation defaults.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'dense',
    defaultTypography: 'scientific serif sans',
    defaultTickStrategy: 'dense for broad-magnitude physics values',
    defaultLabelStrategy: 'scientific notation majors',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['physics constants', 'scale analysis'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'dense',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  chemistry: {
    id: 'chemistry',
    purpose: 'Chemistry-oriented profile for concentration and ratio domains.',
    projection: 'logarithmic',
    formatter: 'scientific',
    defaultDensity: 'balanced',
    defaultTypography: 'scientific sans',
    defaultTickStrategy: 'balanced chemical-range segmentation',
    defaultLabelStrategy: 'scientific major labels',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['concentration calculations', 'reaction ratio estimation'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      logarithmicDisplayFormat: 'scientific',
      logarithmicLabelStyle: 'scientific'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  mathematics: {
    id: 'mathematics',
    purpose: 'Pure mathematics profile with precision-oriented defaults.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'engineering',
    defaultTypography: 'mathematical mono',
    defaultTickStrategy: 'precision major grid with controlled minors',
    defaultLabelStrategy: 'high precision value labels',
    manufacturingClass: 'scientific',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['teaching scales', 'analytic estimation'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'engineering',
      logarithmicDisplayFormat: 'engineering'
    },
    manufacturingRecommendation: scientificRecommendation
  },
  'metric-conversion': {
    id: 'metric-conversion',
    purpose: 'Metric conversion profile.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform conversion segmentation',
    defaultLabelStrategy: 'paired decimal conversion labels',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer'],
    typicalApplications: ['metric unit conversion', 'shop-floor calculations'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  'imperial-conversion': {
    id: 'imperial-conversion',
    purpose: 'Imperial conversion profile.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform conversion segmentation',
    defaultLabelStrategy: 'paired decimal conversion labels',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer'],
    typicalApplications: ['imperial unit conversion', 'maintenance workflows'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  length: {
    id: 'length',
    purpose: 'Length conversion and proportion profile.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform linear segmentation',
    defaultLabelStrategy: 'decimal labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer'],
    typicalApplications: ['length conversion', 'dimensional checks'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: generalRecommendation
  },
  mass: {
    id: 'mass',
    purpose: 'Mass conversion profile.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform linear segmentation',
    defaultLabelStrategy: 'decimal labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer'],
    typicalApplications: ['mass conversion', 'payload planning'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: generalRecommendation
  },
  pressure: {
    id: 'pressure',
    purpose: 'Pressure ratio and conversion profile.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'engineering',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'engineering-safe pressure spacing',
    defaultLabelStrategy: 'value labels with pressure-friendly rounding',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['fluid systems', 'instrument calibration'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'engineering'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  temperature: {
    id: 'temperature',
    purpose: 'Temperature conversion and comparison profile.',
    projection: 'linear',
    formatter: 'decimal',
    defaultDensity: 'balanced',
    defaultTypography: 'technical sans',
    defaultTickStrategy: 'uniform linear segmentation',
    defaultLabelStrategy: 'decimal labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer'],
    typicalApplications: ['temperature conversion', 'process checks'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: generalRecommendation
  },
  velocity: {
    id: 'velocity',
    purpose: 'Velocity and speed conversion profile.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'balanced',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'balanced major velocity anchors',
    defaultLabelStrategy: 'value labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['velocity conversion', 'kinematics planning'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: generalRecommendation
  },
  power: {
    id: 'power',
    purpose: 'Power and energy ratio profile.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'engineering',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'engineering spacing for broad dynamic range',
    defaultLabelStrategy: 'value labels with dense majors',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['power scaling', 'efficiency calculations'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'engineering'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  torque: {
    id: 'torque',
    purpose: 'Torque and leverage conversion profile.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'balanced',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'balanced with torque anchors',
    defaultLabelStrategy: 'value labels',
    manufacturingClass: 'industrial',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['torque conversion', 'mechanical setup'],
    defaults: {
      includeMinorLabels: false,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: industrialRecommendation
  },
  'mechanical-advantage': {
    id: 'mechanical-advantage',
    purpose: 'Mechanical advantage and leverage profile.',
    projection: 'logarithmic',
    formatter: 'engineering',
    defaultDensity: 'balanced',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'ratio-centered logarithmic spacing',
    defaultLabelStrategy: 'value labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['lever systems', 'gear train approximation'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced'
    },
    manufacturingRecommendation: generalRecommendation
  },
  ratio: {
    id: 'ratio',
    purpose: 'General ratio profile for comparative scaling.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'balanced',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'single decade ratio spacing',
    defaultLabelStrategy: 'mantissa labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['ratio calculation', 'scale matching'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      logarithmicDisplayFormat: 'slide-rule'
    },
    manufacturingRecommendation: generalRecommendation
  },
  proportion: {
    id: 'proportion',
    purpose: 'Proportion profile for cross-multiplication workflows.',
    projection: 'logarithmic',
    formatter: 'slide-rule',
    defaultDensity: 'balanced',
    defaultTypography: 'engineering mono',
    defaultTickStrategy: 'single decade proportion spacing',
    defaultLabelStrategy: 'mantissa labels',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['proportional reasoning', 'design scaling'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      logarithmicDisplayFormat: 'slide-rule'
    },
    manufacturingRecommendation: generalRecommendation
  },
  custom: {
    id: 'custom',
    purpose: 'User-defined profile with custom projection and formatter controls.',
    projection: 'custom',
    formatter: 'custom',
    defaultDensity: 'balanced',
    defaultTypography: 'custom technical',
    defaultTickStrategy: 'user-configured',
    defaultLabelStrategy: 'user-configured',
    manufacturingClass: 'general',
    compatibleRings: ['outer', 'inner'],
    typicalApplications: ['custom domains', 'experimental profile creation'],
    defaults: {
      includeMinorLabels: true,
      tickDensityProfile: 'balanced',
      customProjectionExponent: 1,
      customProjectionScale: 1,
      customProjectionOffset: 0
    },
    manufacturingRecommendation: generalRecommendation
  }
};

const ringTypeToProfile: Partial<Record<NonNullable<ScalePluginConfig['logarithmicRingType']>, EngineeringProfileKind>> = {
  C: 'C',
  D: 'D',
  CI: 'CI',
  DI: 'CI',
  A: 'A',
  B: 'B',
  K: 'K',
  L: 'L',
  LL: 'LL1',
  aviation: 'aviation',
  custom: 'custom'
};

const toDisplayFormat = (formatter: FormatterKind): NonNullable<ScalePluginConfig['logarithmicDisplayFormat']> => {
  if (formatter === 'scientific') {
    return 'scientific';
  }
  if (formatter === 'navitimer') {
    return 'navitimer';
  }
  if (formatter === 'slide-rule' || formatter === 'mantissa') {
    return 'slide-rule';
  }
  if (formatter === 'custom') {
    return 'custom';
  }
  return 'engineering';
};

const toLabelStyle = (formatter: FormatterKind): NonNullable<ScalePluginConfig['logarithmicLabelStyle']> => {
  if (formatter === 'scientific') {
    return 'scientific';
  }
  if (formatter === 'mantissa' || formatter === 'slide-rule' || formatter === 'navitimer') {
    return 'mantissa';
  }
  return 'value';
};

const setValue = <T>(
  candidate: T | undefined,
  existing: T | undefined,
  overrideExisting: boolean
): T | undefined => {
  if (overrideExisting) {
    return candidate ?? existing;
  }
  return existing ?? candidate;
};

const toProfileDefaults = (
  definition: EngineeringProfileDefinition,
  existing: ScalePluginConfig,
  options?: ApplyProfileOptions
): Partial<ScalePluginConfig> => {
  const overrideExisting = options?.overrideExisting ?? false;

  return {
    projectionKind:
      options?.preserveProjection === true
        ? existing.projectionKind
        : setValue(definition.projection, existing.projectionKind, overrideExisting),
    formatterKind: setValue(definition.formatter, existing.formatterKind, overrideExisting),
    logarithmicDisplayFormat: setValue(
      toDisplayFormat(definition.formatter),
      existing.logarithmicDisplayFormat,
      overrideExisting
    ),
    logarithmicLabelStyle: setValue(
      toLabelStyle(definition.formatter),
      existing.logarithmicLabelStyle,
      overrideExisting
    ),
    tickDensityProfile: setValue(definition.defaultDensity, existing.tickDensityProfile, overrideExisting),
    includeMinorLabels: setValue(definition.defaults.includeMinorLabels, existing.includeMinorLabels, overrideExisting),
    logarithmicDecades: setValue(definition.defaults.logarithmicDecades, existing.logarithmicDecades, overrideExisting),
    logarithmicRingType: setValue(definition.defaults.logarithmicRingType, existing.logarithmicRingType, overrideExisting),
    engineeringPreset: setValue(definition.defaults.engineeringPreset, existing.engineeringPreset, overrideExisting)
  };
};

export const listEngineeringProfiles = (): EngineeringProfileKind[] => {
  return Object.keys(profileTable) as EngineeringProfileKind[];
};

export const listFormatterKinds = (): FormatterKind[] => {
  return ['engineering', 'scientific', 'slide-rule', 'navitimer', 'mantissa', 'decimal', 'custom'];
};

export const getEngineeringProfileDefinition = (
  profileKind: EngineeringProfileKind
): EngineeringProfileDefinition | null => {
  return profileTable[profileKind] ?? null;
};

export const resolveEngineeringProfile = (config: ScalePluginConfig): EngineeringProfileKind => {
  if (config.engineeringProfileKind) {
    return config.engineeringProfileKind;
  }

  if (config.logarithmicRingType && ringTypeToProfile[config.logarithmicRingType]) {
    return ringTypeToProfile[config.logarithmicRingType] ?? 'custom';
  }

  return 'C';
};

export const buildProfileDefaults = (
  profileKind: EngineeringProfileKind,
  existing: ScalePluginConfig,
  options?: ApplyProfileOptions
): Partial<ScalePluginConfig> => {
  const definition = profileTable[profileKind];
  if (!definition) {
    return {
      engineeringProfileKind: profileKind
    };
  }

  return {
    engineeringProfileKind: profileKind,
    ...definition.defaults,
    ...toProfileDefaults(definition, existing, options)
  };
};

export const applyEngineeringProfile = (config: ScalePluginConfig): ScalePluginConfig => {
  const profileKind = resolveEngineeringProfile(config);
  const defaults = buildProfileDefaults(profileKind, config, {
    overrideExisting: false,
    preserveProjection: false
  });

  return {
    ...config,
    ...defaults
  };
};

export const getProfileManufacturingRecommendation = (
  profileKind: EngineeringProfileKind
): ManufacturingRecommendation | null => {
  const definition = profileTable[profileKind];
  return definition?.manufacturingRecommendation ?? null;
};

export const getProfileManufacturingDiagnostics = (
  profileKind: EngineeringProfileKind,
  config: ScalePluginConfig
): string[] => {
  const recommendation = getProfileManufacturingRecommendation(profileKind);
  if (!recommendation) {
    return [];
  }

  const warnings: string[] = [];
  const ringWidth = Math.max(0, (config.bandOuterRadiusMm ?? 0) - (config.bandInnerRadiusMm ?? 0));

  if (ringWidth > 0 && ringWidth < recommendation.minimumRingWidthMm) {
    warnings.push(
      `Recommended minimum ring width is ${recommendation.minimumRingWidthMm.toFixed(2)} mm for ${profileKind}; current ring width is ${ringWidth.toFixed(2)} mm.`
    );
  }

  if ((config.minimumLineWidthMm ?? 0) < recommendation.recommendedPadPrintSpacingMm) {
    warnings.push(
      `Recommended pad-print spacing is ${recommendation.recommendedPadPrintSpacingMm.toFixed(2)} mm for ${profileKind}.`
    );
  }

  warnings.push(
    `Manufacturing guidance (${profileKind}): min font ${recommendation.minimumPrintableFontMm.toFixed(2)} mm, engraving depth ${recommendation.recommendedEngravingDepthMm.toFixed(2)} mm, laser density ${recommendation.recommendedLaserDensity.toFixed(2)}.`
  );

  return warnings;
};

export const getEngineeringProfileLibrary = (): EngineeringProfileDefinition[] => {
  return listEngineeringProfiles().map((profileKind) => profileTable[profileKind]).filter(Boolean);
};

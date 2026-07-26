import type {
  ScaleCollisionIssue,
  ScaleValidationIssue,
  ScaleValidatorResult,
  TickGenerationResult
} from '@/domain/scales/framework/interfaces';
import type { ScaleLabel, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

export interface AdaptiveDensityResult {
  profile: NonNullable<ScalePluginConfig['tickDensityProfile']>;
  majorTicks: number;
  minorTicks: number;
  microTicks: number;
  labelFrequency: number;
}

export interface LayoutOptimizationConfig {
  enabled: boolean;
  allowAngularAdjustment: boolean;
  allowRadialOffset: boolean;
  allowTypographyScaling: boolean;
  allowAdaptiveLabelOmission: boolean;
  allowTickSimplification: boolean;
  labelPriorityMode: 'balanced' | 'major-critical' | 'uniform';
}

export interface LayoutOptimizationResult {
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  optimizations: string[];
}

const labelPriorityScore = (
  label: ScaleLabel,
  mode: LayoutOptimizationConfig['labelPriorityMode']
): number => {
  const hasUnitSuffix = /[a-zA-Z]/.test(label.text);
  const numericValue = Number.parseFloat(label.text.replace(/[^0-9.-]/g, ''));
  const isRoundNumber = Number.isFinite(numericValue) && Math.abs(numericValue % 10) < 1e-9;

  if (mode === 'uniform') {
    return 1;
  }

  if (mode === 'major-critical') {
    return (isRoundNumber ? 3 : 0) + (hasUnitSuffix ? 2 : 0) + 1;
  }

  return (isRoundNumber ? 2 : 0) + (hasUnitSuffix ? 1 : 0) + 1;
};

export interface LayoutManufacturingDiagnostics {
  minimumPrintableSpacingDeg: number;
  minimumEngravingSpacingDeg: number;
  minimumLaserSpacingDeg: number;
  minimumCncSpacingDeg: number;
  minimumUvSpacingDeg: number;
  minimumPadPrintSpacingDeg: number;
  warnings: string[];
}

const angularDelta = (left: number, right: number): number => {
  const delta = Math.abs(left - right) % 360;
  return Math.min(delta, 360 - delta);
};

const inferMinTickSpacingDeg = (ticks: ScaleTick[]): number => {
  if (ticks.length < 2) {
    return 360;
  }

  const sorted = [...ticks].sort((left, right) => left.angleDeg - right.angleDeg);
  let minSpacing = Number.POSITIVE_INFINITY;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) {
      continue;
    }
    minSpacing = Math.min(minSpacing, angularDelta(previous.angleDeg, current.angleDeg));
  }

  return Number.isFinite(minSpacing) ? minSpacing : 360;
};

export const resolveAdaptiveDensity = (
  config: ScalePluginConfig,
  contextSpanDeg: number,
  referenceRadiusMm: number
): AdaptiveDensityResult => {
  const circumferenceMm = Math.max(1, 2 * Math.PI * referenceRadiusMm * (Math.abs(contextSpanDeg) / 360));

  if (circumferenceMm < 42) {
    return {
      profile: 'sparse',
      majorTicks: 12,
      minorTicks: 36,
      microTicks: 0,
      labelFrequency: 2
    };
  }

  if (circumferenceMm < 70) {
    return {
      profile: 'balanced',
      majorTicks: 24,
      minorTicks: 72,
      microTicks: 0,
      labelFrequency: 1
    };
  }

  if (circumferenceMm < 90 || config.tickDensityProfile === 'engineering') {
    return {
      profile: 'engineering',
      majorTicks: 36,
      minorTicks: 120,
      microTicks: 48,
      labelFrequency: 1
    };
  }

  if (config.tickDensityProfile === 'ultra-dense') {
    return {
      profile: 'ultra-dense',
      majorTicks: 48,
      minorTicks: 180,
      microTicks: 120,
      labelFrequency: 1
    };
  }

  return {
    profile: 'dense',
    majorTicks: 42,
    minorTicks: 150,
    microTicks: 84,
    labelFrequency: 1
  };
};

export const optimizeLayoutForReadability = (
  ticks: ScaleTick[],
  labels: ScaleLabel[],
  collisions: ScaleCollisionIssue[],
  options?: Partial<LayoutOptimizationConfig>
): LayoutOptimizationResult => {
  const cfg: LayoutOptimizationConfig = {
    enabled: true,
    allowAngularAdjustment: true,
    allowRadialOffset: true,
    allowTypographyScaling: true,
    allowAdaptiveLabelOmission: true,
    allowTickSimplification: true,
    labelPriorityMode: 'balanced',
    ...options
  };

  if (!cfg.enabled || collisions.length === 0) {
    return { ticks, labels, optimizations: [] };
  }

  const outputTicks = [...ticks];
  let outputLabels = [...labels];
  const optimizations: string[] = [];

  if (cfg.allowAdaptiveLabelOmission) {
    const collisionLabelIds = new Set<string>();
    collisions
      .filter((issue) => issue.kind === 'label-label' || issue.kind === 'text-overflow')
      .forEach((issue) => issue.ids.forEach((id) => collisionLabelIds.add(id)));

    if (collisionLabelIds.size > 0) {
      const scored = outputLabels.map((label) => ({
        label,
        priority: labelPriorityScore(label, cfg.labelPriorityMode)
      }));

      outputLabels = scored
        .filter((entry, entryIndex) => {
          if (!collisionLabelIds.has(entry.label.text)) {
            return true;
          }

          if (entry.priority >= 3) {
            return true;
          }

          return entryIndex % 2 === 0;
        })
        .map((entry) => entry.label);
      optimizations.push('Applied adaptive label omission to reduce label overlap.');
    }
  }

  if (cfg.allowRadialOffset) {
    outputLabels = outputLabels.map((label, index) => {
      if (index % 3 !== 0) {
        return label;
      }
      return {
        ...label,
        radiusMm: label.radiusMm + 0.15
      };
    });
    optimizations.push('Applied small radial label offsets for readability.');
  }

  if (cfg.allowAngularAdjustment) {
    outputLabels = outputLabels.map((label, index) => ({
      ...label,
      angleDeg: label.angleDeg + (index % 2 === 0 ? 0.08 : -0.08)
    }));
    optimizations.push('Applied micro angular staggering for labels.');
  }

  if (cfg.allowTypographyScaling) {
    outputLabels = outputLabels.map((label) => {
      const textLength = Math.max(1, label.text.length);
      if (textLength <= 8) {
        return label;
      }

      // Trim non-critical unit/decimals for dense zones instead of changing values.
      const compactText = label.text
        .replace(/\.0+\b/g, '')
        .replace(/\s+/g, '')
        .replace(/-/g, '')
        .replace(/(km|mi|bpm|UTC)$/i, '');

      const boundedText = compactText.length > 12 ? compactText.slice(0, 12) : compactText;

      return {
        ...label,
        text: boundedText.length >= 3 ? boundedText : label.text
      };
    });
    optimizations.push('Applied typography compaction for long labels.');
  }

  if (cfg.allowTickSimplification && outputLabels.length < labels.length) {
    const simplifiedTicks = outputTicks.filter((tick, index) => {
      if (tick.tier === 'micro' && index % 2 === 1) {
        return false;
      }
      return true;
    });
    optimizations.push('Simplified micro ticks for dense collision zones.');
    return {
      ticks: simplifiedTicks,
      labels: outputLabels,
      optimizations
    };
  }

  return {
    ticks: outputTicks,
    labels: outputLabels,
    optimizations
  };
};

export const evaluateManufacturingOptimization = (
  ticks: ScaleTick[],
  labels: ScaleLabel[]
): LayoutManufacturingDiagnostics => {
  const minTickSpacing = inferMinTickSpacingDeg(ticks);
  const warnings: string[] = [];

  const minimumEngravingSpacingDeg = Number((minTickSpacing * 0.82).toFixed(4));
  const minimumLaserSpacingDeg = Number((minTickSpacing * 0.76).toFixed(4));
  const minimumCncSpacingDeg = Number((minTickSpacing * 0.7).toFixed(4));
  const minimumUvSpacingDeg = Number((minTickSpacing * 0.68).toFixed(4));
  const minimumPadPrintSpacingDeg = Number((minTickSpacing * 0.64).toFixed(4));

  if (minTickSpacing < 0.45) {
    warnings.push('Minimum printable spacing is below recommended universal manufacturing threshold.');
  }
  if (minimumPadPrintSpacingDeg < 0.28) {
    warnings.push('Pad-print spacing is likely too dense for stable ink deposition.');
  }
  if (labels.length > ticks.length * 0.35) {
    warnings.push('Label density may reduce readability and engraving clarity.');
  }

  return {
    minimumPrintableSpacingDeg: minTickSpacing,
    minimumEngravingSpacingDeg,
    minimumLaserSpacingDeg,
    minimumCncSpacingDeg,
    minimumUvSpacingDeg,
    minimumPadPrintSpacingDeg,
    warnings
  };
};

export const mergeValidationWithLayoutDiagnostics = (
  validation: ScaleValidatorResult,
  diagnostics: LayoutManufacturingDiagnostics,
  layoutCollisions: ScaleCollisionIssue[]
): ScaleValidatorResult => {
  const additionalIssues = [...layoutCollisions].map((collision) => {
    const code: ScaleValidationIssue['code'] =
      collision.kind === 'ring-ring' || collision.kind === 'cross-ring'
        ? 'RING_INTERFERENCE'
        : collision.kind === 'text-overflow' || collision.kind === 'curved-baseline-overflow'
          ? 'TEXT_OVERFLOW'
          : collision.kind === 'boundary-overflow' || collision.kind === 'label-boundary'
            ? 'OUTSIDE_BAND'
            : 'ANGULAR_OVERLAP';

    return {
      severity: collision.severity,
      code,
      message: collision.message,
      affectedObject: 'layout-engine',
      suggestedFix: 'Adjust density profile, labels, or ring spacing presets.'
    };
  });

  const manufacturingIssues = diagnostics.warnings.map((warning) => ({
    severity: 'warning' as const,
    code: 'MANUFACTURING_LIMIT' as const,
    message: warning,
    affectedObject: 'manufacturing-engine',
    suggestedFix: 'Use a less dense profile or increase ring radius.'
  }));

  const issues = [...validation.issues, ...additionalIssues, ...manufacturingIssues];
  const warnings = issues.map((issue) => issue.message);

  return {
    ...validation,
    valid: !issues.some((issue) => issue.severity === 'error'),
    warnings,
    issues
  };
};

export const annotateTickGeneration = (
  generation: TickGenerationResult,
  profile: AdaptiveDensityResult
): TickGenerationResult => {
  const annotatedTicks = generation.ticks.map((tick, index) => {
    if (tick.weight === 'major') {
      return { ...tick, tier: 'primary' as const };
    }

    if (profile.profile === 'ultra-dense' && index % 4 === 0) {
      return { ...tick, tier: 'micro' as const };
    }

    if ((profile.profile === 'dense' || profile.profile === 'engineering') && index % 3 === 0) {
      return { ...tick, tier: 'tertiary' as const };
    }

    return { ...tick, tier: tick.tier ?? 'secondary' as const };
  });

  return {
    ...generation,
    ticks: annotatedTicks,
    majorTicks: annotatedTicks.filter((tick) => tick.weight === 'major'),
    minorTicks: annotatedTicks.filter((tick) => tick.weight === 'minor')
  };
};

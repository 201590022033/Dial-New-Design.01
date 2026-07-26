import type {
  CollisionDetector,
  CollisionDetectorInput,
  ScaleCollisionIssue
} from '@/domain/scales/framework/interfaces';

const normalizeAngle = (angleDeg: number): number => {
  let value = angleDeg % 360;
  if (value < 0) {
    value += 360;
  }
  return value;
};

const angularDelta = (a: number, b: number): number => {
  const delta = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(delta, 360 - delta);
};

export const createCollisionFramework = (): CollisionDetector => {
  return {
    detect: (input: CollisionDetectorInput): ScaleCollisionIssue[] => {
      const issues: ScaleCollisionIssue[] = [];
      const labels = input.labels;
      const ticks = input.ticks;

      const sortedLabels = [...labels].sort((left, right) => left.angleDeg - right.angleDeg);
      for (let index = 1; index < sortedLabels.length; index += 1) {
        const previous = sortedLabels[index - 1];
        const current = sortedLabels[index];
        if (!previous || !current) {
          continue;
        }

        const radial = Math.abs(previous.radiusMm - current.radiusMm);
        const delta = angularDelta(previous.angleDeg, current.angleDeg);
        const approxCharFactor = 0.42;
        const previousArc = (Math.max(previous.text.length, 1) * approxCharFactor * 180) / (Math.PI * Math.max(previous.radiusMm, 1));
        const currentArc = (Math.max(current.text.length, 1) * approxCharFactor * 180) / (Math.PI * Math.max(current.radiusMm, 1));
        const minGap = (previousArc + currentArc) * 0.5;

        if (delta < minGap && radial < 1.2) {
          issues.push({
            kind: 'label-label',
            severity: 'warning',
            message: `Label overlap risk between ${previous.text} and ${current.text}.`,
            ids: [previous.text, current.text]
          });
        }
      }

      labels.forEach((label) => {
        if (label.radiusMm < input.config.bandInnerRadiusMm || label.radiusMm > input.config.bandOuterRadiusMm + 4) {
          issues.push({
            kind: 'label-boundary',
            severity: 'warning',
            message: `Label ${label.text} extends outside preferred boundary envelope.`,
            ids: [label.text]
          });
        }
      });

      ticks.forEach((tick, index) => {
        if (tick.radiusMm < input.config.bandInnerRadiusMm - 1 || tick.radiusMm > input.config.bandOuterRadiusMm + 1) {
          issues.push({
            kind: 'boundary-overflow',
            severity: 'warning',
            message: `Tick ${index} is outside ring boundary tolerance.`,
            ids: [`tick-${index}`]
          });
        }
      });

      ticks.forEach((tick, index) => {
        const nearestLabel = labels.reduce<{ labelText: string; delta: number } | null>((closest, label) => {
          const delta = angularDelta(label.angleDeg, tick.angleDeg);
          if (!closest || delta < closest.delta) {
            return { labelText: label.text, delta };
          }
          return closest;
        }, null);

        if (nearestLabel && nearestLabel.delta < 0.25 && tick.weight === 'minor') {
          issues.push({
            kind: 'tick-label',
            severity: 'info',
            message: `Minor tick ${index} approaches label ${nearestLabel.labelText}.`,
            ids: [`tick-${index}`, nearestLabel.labelText]
          });
        }
      });

      return issues;
    }
  };
};

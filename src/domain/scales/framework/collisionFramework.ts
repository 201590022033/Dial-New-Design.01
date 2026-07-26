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

      const sortedTicks = [...ticks].sort((left, right) => left.angleDeg - right.angleDeg);
      for (let index = 1; index < sortedTicks.length; index += 1) {
        const previous = sortedTicks[index - 1];
        const current = sortedTicks[index];
        if (!previous || !current) {
          continue;
        }

        const delta = angularDelta(previous.angleDeg, current.angleDeg);
        if (delta < 0.12) {
          issues.push({
            kind: 'tick-tick',
            severity: 'warning',
            message: `Tick crowding detected near ${current.angleDeg.toFixed(3)} degrees.`,
            ids: [
              `${previous.ringId ?? 'ring'}-${index - 1}`,
              `${current.ringId ?? 'ring'}-${index}`
            ]
          });
        }
      }

      const outerTicks = ticks.filter((tick) => tick.ringId === 'outer');
      const innerTicks = ticks.filter((tick) => tick.ringId === 'inner');
      if (outerTicks.length > 0 && innerTicks.length > 0) {
        const radialGap = Math.abs(
          (outerTicks[0]?.radiusMm ?? 0) -
            (innerTicks[0]?.radiusMm ?? 0)
        );

        if (radialGap < 0.65) {
          issues.push({
            kind: 'ring-ring',
            severity: 'warning',
            message: 'Ring-to-ring radial spacing is tight and may cause visual interference.',
            ids: ['outer-ring', 'inner-ring']
          });
        }

        let crossRingNearMisses = 0;
        outerTicks.slice(0, 120).forEach((outerTick) => {
          innerTicks.slice(0, 120).forEach((innerTick) => {
            if (angularDelta(outerTick.angleDeg, innerTick.angleDeg) < 0.08) {
              crossRingNearMisses += 1;
            }
          });
        });

        if (crossRingNearMisses > 10) {
          issues.push({
            kind: 'cross-ring',
            severity: 'info',
            message: 'Cross-ring angular interference density is elevated.',
            ids: ['outer-ring', 'inner-ring']
          });
        }
      }

      labels.forEach((label) => {
        if (label.text.length > 14) {
          issues.push({
            kind: 'text-overflow',
            severity: 'warning',
            message: `Label ${label.text} may overflow available arc width.`,
            ids: [label.text]
          });
        }

        if (label.orientation === 'curved' && label.text.length > 10 && label.radiusMm < input.config.radiusMm) {
          issues.push({
            kind: 'curved-baseline-overflow',
            severity: 'info',
            message: `Curved baseline for ${label.text} may exceed inner arc comfort radius.`,
            ids: [label.text]
          });
        }
      });

      return issues;
    }
  };
};

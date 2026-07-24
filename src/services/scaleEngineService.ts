import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import type {
  ScaleKind,
  ScaleLabel,
  ScaleMathContext,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

export interface ScaleRunResult {
  kind: ScaleKind;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  validation: ScaleValidationResult;
  svg: string;
  preview: string;
}

export const runScalePlugin = (
  kind: ScaleKind,
  config: ScalePluginConfig,
  context: ScaleMathContext
): ScaleRunResult | null => {
  const plugin = getScalePlugin(kind);
  if (!plugin) {
    return null;
  }

  const validation = plugin.validate(config);
  const ticks = plugin.tickGenerator(config, context);
  const labels = plugin.labelGenerator(ticks, config);

  return {
    kind,
    ticks,
    labels,
    validation,
    svg: plugin.svgOutput(ticks, labels),
    preview: plugin.previewGenerator(config, context)
  };
};

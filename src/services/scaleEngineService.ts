import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import type {
  ScaleGeometryOutput,
  ScaleKind,
  ScaleLabel,
  ScaleMathContext,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

export interface ScaleRunResult {
  kind: ScaleKind;
  pluginName: string;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  geometry: ScaleGeometryOutput;
  validation: ScaleValidationResult;
  svg: string;
  preview: string;
}

const resultCache = new Map<string, ScaleRunResult>();

const createCacheKey = (kind: ScaleKind, config: ScalePluginConfig, context: ScaleMathContext): string => {
  return `${kind}:${JSON.stringify(config)}:${JSON.stringify(context)}`;
};

export const runScalePlugin = (
  kind: ScaleKind,
  config: ScalePluginConfig,
  context: ScaleMathContext
): ScaleRunResult | null => {
  const cacheKey = createCacheKey(kind, config, context);
  const cached = resultCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const plugin = getScalePlugin(kind);
  if (!plugin) {
    return null;
  }

  const ticks = plugin.tickGenerator(config, context);
  const labels = plugin.labelGenerator(ticks, config);
  const geometry = plugin.geometryGenerator(ticks, labels);
  const validation = plugin.validate(config, ticks, labels);

  const result: ScaleRunResult = {
    kind,
    pluginName: plugin.metadata.name,
    ticks,
    labels,
    geometry,
    validation,
    svg: plugin.svgOutput(ticks, labels),
    preview: plugin.previewGenerator(config, context)
  };

  resultCache.set(cacheKey, result);
  if (resultCache.size > 50) {
    const firstKey = resultCache.keys().next().value;
    if (firstKey) {
      resultCache.delete(firstKey);
    }
  }

  return result;
};

export const clearScaleEngineCache = (): void => {
  resultCache.clear();
};

import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { styleScaleTicks } from '@/domain/scales/markingStyle';
import type {
  ScaleGeometryOutput,
  ScaleKind,
  ScaleLabel,
  ScaleMathContext,
  ScaleManufacturingMetadata,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

export interface ScaleRunResult {
  kind: ScaleKind;
  pluginName: string;
  fontSizeMm: number;
  fontFamily: string;
  color: string;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  geometry: ScaleGeometryOutput;
  validation: ScaleValidationResult;
  svg: string;
  preview: string;
  manufacturingMetadata?: ScaleManufacturingMetadata;
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

  const ticks = styleScaleTicks(plugin.tickGenerator(config, context), config);
  const labels = plugin.labelGenerator(ticks, config);
  const geometry = plugin.geometryGenerator(ticks, labels);
  const validation = plugin.validate(config, ticks, labels);

  const result: ScaleRunResult = {
    kind,
    pluginName: plugin.metadata.name,
    fontSizeMm: config.scaleFontSizeMm ?? 0.8,
    fontFamily: config.fontFamily,
    color: config.color,
    ticks,
    labels,
    geometry,
    validation,
    svg: plugin.svgOutput(ticks, labels),
    preview: plugin.previewGenerator(config, context),
    manufacturingMetadata: plugin.manufacturingMetadata?.(ticks, labels, config)
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

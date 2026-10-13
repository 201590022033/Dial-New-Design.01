import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
/** Move older ring-targeted decimal-hour artwork onto the dial without losing its authored controls. */
export const withDialOnlyDecimalHours = (assembly: WatchAssembly): WatchAssembly => {
  const document = assembly.designConfig?.customAviationLayers;
  if (!document || !Array.isArray(document.layers) || !document.layers.some(layer => layer?.id === 'decimal-hour' && typeof layer.targetBandId === 'string' && layer.targetBandId !== 'band-dial-face')) return assembly;
  return { ...assembly, designConfig: { ...assembly.designConfig, customAviationLayers: { ...document,
    layers: document.layers.map(layer => layer?.id === 'decimal-hour' && typeof layer.targetBandId === 'string' ? { ...layer, targetBandId: 'band-dial-face' } : layer) } } };
};

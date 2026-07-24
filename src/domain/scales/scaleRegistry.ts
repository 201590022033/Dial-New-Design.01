import { builtInScalePlugins } from '@/domain/scales/plugins/builtInPlugins';
import type { ScaleKind, ScalePlugin } from '@/domain/scales/types';

const pluginMap = new Map<ScaleKind, ScalePlugin>();

builtInScalePlugins.forEach((plugin) => {
  pluginMap.set(plugin.kind, plugin);
});

export const registerScalePlugin = (plugin: ScalePlugin): void => {
  pluginMap.set(plugin.kind, plugin);
};

export const getScalePlugin = (kind: ScaleKind): ScalePlugin | null => {
  return pluginMap.get(kind) ?? null;
};

export const listScalePlugins = (): ScalePlugin[] => {
  return [...pluginMap.values()];
};

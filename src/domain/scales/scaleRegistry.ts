import { builtInScalePlugins } from '@/domain/scales/plugins/builtInPlugins';
import type { ScaleCategory, ScaleKind, ScalePlugin, ScaleRegistryEntry } from '@/domain/scales/types';

const pluginMap = new Map<ScaleKind, ScaleRegistryEntry>();

builtInScalePlugins.forEach((plugin) => {
  pluginMap.set(plugin.kind, {
    plugin,
    enabled: plugin.metadata.enabledByDefault,
    source: 'built-in'
  });
});

export const registerScalePlugin = (plugin: ScalePlugin, source: 'built-in' | 'user' = 'user'): void => {
  pluginMap.set(plugin.kind, {
    plugin,
    enabled: plugin.metadata.enabledByDefault,
    source
  });
};

export const unregisterScalePlugin = (kind: ScaleKind): boolean => {
  const entry = pluginMap.get(kind);
  if (!entry || entry.source === 'built-in') {
    return false;
  }

  return pluginMap.delete(kind);
};

export const setScalePluginEnabled = (kind: ScaleKind, enabled: boolean): boolean => {
  const entry = pluginMap.get(kind);
  if (!entry) {
    return false;
  }

  pluginMap.set(kind, {
    ...entry,
    enabled
  });

  return true;
};

export const getScalePlugin = (kind: ScaleKind): ScalePlugin | null => {
  const entry = pluginMap.get(kind);
  if (!entry || !entry.enabled) {
    return null;
  }

  return entry.plugin;
};

export const getScalePluginEntry = (kind: ScaleKind): ScaleRegistryEntry | null => {
  return pluginMap.get(kind) ?? null;
};

export const listScalePluginEntries = (): ScaleRegistryEntry[] => {
  return [...pluginMap.values()];
};

export const listScalePlugins = (includeDisabled = false): ScalePlugin[] => {
  return [...pluginMap.values()]
    .filter((entry) => includeDisabled || entry.enabled)
    .map((entry) => entry.plugin);
};

export const listScalePluginsByCategory = (
  category: ScaleCategory,
  includeDisabled = false
): ScalePlugin[] => {
  return listScalePlugins(includeDisabled).filter((plugin) => plugin.metadata.category === category);
};

export const getScalePluginMetadata = () => {
  return [...pluginMap.values()].map((entry) => ({
    kind: entry.plugin.kind,
    name: entry.plugin.metadata.name,
    description: entry.plugin.metadata.description,
    category: entry.plugin.metadata.category,
    enabled: entry.enabled,
    source: entry.source
  }));
};

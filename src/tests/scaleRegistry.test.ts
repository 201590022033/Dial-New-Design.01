import { describe, expect, it } from 'vitest';
import {
  getScalePluginEntry,
  listScalePluginsByCategory,
  registerScalePlugin,
  setScalePluginEnabled,
  unregisterScalePlugin
} from '@/domain/scales/scaleRegistry';
import { createCircularPlugin } from '@/domain/scales/plugins/createCircularPlugin';

describe('scale registry', () => {
  it('can register, disable, and unregister user plugins', () => {
    const plugin = createCircularPlugin({
      kind: 'custom',
      displayName: 'Custom User Scale',
      description: 'User supplied plugin for testing.',
      category: 'custom'
    });

    registerScalePlugin(plugin, 'user');

    const initial = getScalePluginEntry('custom');
    expect(initial?.source).toBe('user');

    const disabled = setScalePluginEnabled('custom', false);
    expect(disabled).toBe(true);
    expect(getScalePluginEntry('custom')?.enabled).toBe(false);

    const removed = unregisterScalePlugin('custom');
    expect(removed).toBe(true);
  });

  it('lists category plugins', () => {
    const timingPlugins = listScalePluginsByCategory('timing', true);
    expect(timingPlugins.length).toBeGreaterThan(0);
  });
});

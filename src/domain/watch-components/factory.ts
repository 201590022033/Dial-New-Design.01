import { watchComponentDefinitions } from '@/domain/watch-components/registry';
import type { WatchComponentEntity, WatchManufacturingMetadata } from '@/domain/watch-components/types';

const defaultManufacturing = (processProfile: WatchManufacturingMetadata['processProfile']): WatchManufacturingMetadata => ({
  processProfile,
  minimumFeatureMm: processProfile === 'cnc' ? 0.2 : 0.12,
  minimumGapMm: processProfile === 'cnc' ? 0.2 : 0.15,
  minimumStrokeWidthMm: processProfile === 'pad-print' ? 0.1 : 0.12,
  recommendations: ['Do not auto-modify geometry on export.', 'Run process profile validation before release.']
});

const profileFromCompatibility = (compatibility: string[]): WatchManufacturingMetadata['processProfile'] => {
  if (compatibility.includes('cnc')) return 'cnc';
  if (compatibility.includes('engraving')) return 'engraving';
  if (compatibility.includes('pad-print')) return 'pad-print';
  if (compatibility.includes('laser')) return 'laser';
  return 'uv-print';
};

export const createWatchComponentEntities = (): WatchComponentEntity[] => {
  return watchComponentDefinitions.map((definition, index) => {
    const processProfile = profileFromCompatibility(definition.pluginCompatibility);

    return {
      id: `watch-component-${definition.kind}`,
      definition,
      visible: true,
      locked: false,
      highlighted: false,
      material: definition.defaultMaterial,
      color: index % 2 === 0 ? '#E2E8F0' : '#CBD5E1',
      texture: definition.defaultTexture,
      dimensions: {
        diameterMm: definition.category === 'rings' ? 34 : definition.category === 'case' ? 40 : 10,
        widthMm: definition.category === 'hands' ? 0.7 : 2,
        thicknessMm: definition.category === 'case' ? 1 : 0.25,
        offsetXmm: 0,
        offsetYmm: 0
      },
      typography: {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSizeMm: definition.category === 'typography' ? 1.4 : 1.1,
        tracking: 0
      },
      manufacturing: defaultManufacturing(processProfile),
      validation: {
        valid: true,
        warnings: []
      },
      metadata: {
        tags: [definition.category, definition.kind],
        revision: 'A',
        notes: `${definition.displayName} initialized from professional component catalog.`
      },
      exportEnabled: definition.exportEnabled
    };
  });
};

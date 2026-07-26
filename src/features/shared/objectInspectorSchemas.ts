import type { BandEntity, BandKind } from '@/domain/bands/types';

export type InspectorSectionKind =
  | 'geometry'
  | 'dimensions'
  | 'appearance'
  | 'material'
  | 'surface-finish'
  | 'texture'
  | 'colour'
  | 'typography'
  | 'scale'
  | 'mathematics'
  | 'tick-marks'
  | 'manufacturing'
  | 'validation'
  | 'export'
  | 'metadata'
  | 'future-extensions'
  | 'preview'
  | 'placeholder';

export interface InspectorSectionSchema {
  id: string;
  title: string;
  kind: InspectorSectionKind;
  defaultOpen?: boolean;
}

export interface ComponentInspectorSchema {
  id: string;
  title: string;
  linkedBandKinds: BandKind[];
  sections: InspectorSectionSchema[];
  placeholder?: boolean;
}

const componentSchemas: Record<string, ComponentInspectorSchema> = {
  bezel: {
    id: 'bezel',
    title: 'Bezel',
    linkedBandKinds: ['outer-bezel', 'inner-bezel'],
    sections: [
      { id: 'bezel-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'bezel-appearance', title: 'Appearance', kind: 'appearance', defaultOpen: true },
      { id: 'bezel-scale', title: 'Scale', kind: 'scale', defaultOpen: true },
      { id: 'bezel-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'bezel-validation', title: 'Validation', kind: 'validation' },
      { id: 'bezel-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'outer-slide-rule': {
    id: 'outer-slide-rule',
    title: 'Outer Slide Rule',
    linkedBandKinds: ['outer-bezel'],
    sections: [
      { id: 'outer-scale-type', title: 'Scale Type', kind: 'scale', defaultOpen: true },
      { id: 'outer-log-math', title: 'Logarithmic Mathematics', kind: 'mathematics', defaultOpen: true },
      { id: 'outer-typography', title: 'Typography', kind: 'typography', defaultOpen: true },
      { id: 'outer-ticks', title: 'Tick Marks', kind: 'tick-marks' },
      { id: 'outer-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'outer-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'inner-slide-rule': {
    id: 'inner-slide-rule',
    title: 'Inner Slide Rule',
    linkedBandKinds: ['inner-bezel'],
    sections: [
      { id: 'inner-scale-type', title: 'Scale Type', kind: 'scale', defaultOpen: true },
      { id: 'inner-log-math', title: 'Logarithmic Mathematics', kind: 'mathematics', defaultOpen: true },
      { id: 'inner-typography', title: 'Typography', kind: 'typography', defaultOpen: true },
      { id: 'inner-ticks', title: 'Tick Marks', kind: 'tick-marks' },
      { id: 'inner-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'inner-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'chapter-ring': {
    id: 'chapter-ring',
    title: 'Chapter Ring',
    linkedBandKinds: ['chapter-ring'],
    sections: [
      { id: 'chapter-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'chapter-appearance', title: 'Appearance', kind: 'appearance', defaultOpen: true },
      { id: 'chapter-typography', title: 'Typography', kind: 'typography', defaultOpen: true },
      { id: 'chapter-scale', title: 'Scale', kind: 'scale', defaultOpen: true },
      { id: 'chapter-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'chapter-validation', title: 'Validation', kind: 'validation' },
      { id: 'chapter-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'minute-track': {
    id: 'minute-track',
    title: 'Minute Track',
    linkedBandKinds: ['chapter-ring'],
    sections: [
      { id: 'minute-track-scale', title: 'Scale Type', kind: 'scale', defaultOpen: true },
      { id: 'minute-track-ticks', title: 'Tick Marks', kind: 'tick-marks', defaultOpen: true },
      { id: 'minute-track-typography', title: 'Typography', kind: 'typography' },
      { id: 'minute-track-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'minute-track-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'hour-markers': {
    id: 'hour-markers',
    title: 'Hour Markers',
    linkedBandKinds: ['chapter-ring', 'indices'],
    sections: [
      { id: 'hour-markers-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'hour-markers-appearance', title: 'Appearance', kind: 'appearance', defaultOpen: true },
      { id: 'hour-markers-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'hour-markers-validation', title: 'Validation', kind: 'validation' },
      { id: 'hour-markers-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'dial-face': {
    id: 'dial-face',
    title: 'Dial Face',
    linkedBandKinds: ['dial-face'],
    sections: [
      { id: 'dial-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'dial-finish', title: 'Surface Finish', kind: 'surface-finish', defaultOpen: true },
      { id: 'dial-texture', title: 'Texture', kind: 'texture', defaultOpen: true },
      { id: 'dial-colour', title: 'Colour', kind: 'colour', defaultOpen: true },
      { id: 'dial-typography', title: 'Typography', kind: 'typography' },
      { id: 'dial-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'dial-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  logo: {
    id: 'logo',
    title: 'Logo',
    linkedBandKinds: ['logo'],
    sections: [
      { id: 'logo-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'logo-dimensions', title: 'Dimensions', kind: 'dimensions', defaultOpen: true },
      { id: 'logo-material', title: 'Material', kind: 'material', defaultOpen: true },
      { id: 'logo-colour', title: 'Colour', kind: 'colour' },
      { id: 'logo-typography', title: 'Typography', kind: 'typography' },
      { id: 'logo-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'logo-validation', title: 'Validation', kind: 'validation' },
      { id: 'logo-export', title: 'Export', kind: 'export' },
      { id: 'logo-metadata', title: 'Metadata', kind: 'metadata' },
      { id: 'logo-future', title: 'Future Extensions', kind: 'future-extensions' },
      { id: 'logo-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  hands: {
    id: 'hands',
    title: 'Hands',
    linkedBandKinds: ['hands'],
    sections: [
      { id: 'hands-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'hands-dimensions', title: 'Dimensions', kind: 'dimensions', defaultOpen: true },
      { id: 'hands-material', title: 'Material', kind: 'material', defaultOpen: true },
      { id: 'hands-colour', title: 'Colour', kind: 'colour' },
      { id: 'hands-texture', title: 'Texture', kind: 'texture' },
      { id: 'hands-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'hands-validation', title: 'Validation', kind: 'validation' },
      { id: 'hands-export', title: 'Export', kind: 'export' },
      { id: 'hands-metadata', title: 'Metadata', kind: 'metadata' },
      { id: 'hands-future', title: 'Future Extensions', kind: 'future-extensions' },
      { id: 'hands-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  complications: {
    id: 'complications',
    title: 'Complications',
    linkedBandKinds: ['complications'],
    sections: [
      { id: 'complications-layout', title: 'Layout', kind: 'geometry', defaultOpen: true },
      { id: 'complications-dimensions', title: 'Dimensions', kind: 'dimensions', defaultOpen: true },
      { id: 'complications-material', title: 'Material', kind: 'material', defaultOpen: true },
      { id: 'complications-colour', title: 'Colour', kind: 'colour' },
      { id: 'complications-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'complications-validation', title: 'Validation', kind: 'validation' },
      { id: 'complications-export', title: 'Export', kind: 'export' },
      { id: 'complications-metadata', title: 'Metadata', kind: 'metadata' },
      { id: 'complications-future', title: 'Future Extensions', kind: 'future-extensions' },
      { id: 'complications-preview', title: 'Preview', kind: 'preview' }
    ]
  },
  'watch-components': {
    id: 'watch-components',
    title: 'Watch Component',
    linkedBandKinds: ['dial-face', 'chapter-ring', 'inner-bezel', 'outer-bezel', 'hands', 'indices', 'text', 'logo', 'complications'],
    sections: [
      { id: 'watch-geometry', title: 'Geometry', kind: 'geometry', defaultOpen: true },
      { id: 'watch-dimensions', title: 'Dimensions', kind: 'dimensions', defaultOpen: true },
      { id: 'watch-material', title: 'Material', kind: 'material', defaultOpen: true },
      { id: 'watch-colour', title: 'Colour', kind: 'colour' },
      { id: 'watch-texture', title: 'Texture', kind: 'texture' },
      { id: 'watch-typography', title: 'Typography', kind: 'typography' },
      { id: 'watch-manufacturing', title: 'Manufacturing', kind: 'manufacturing' },
      { id: 'watch-validation', title: 'Validation', kind: 'validation' },
      { id: 'watch-export', title: 'Export', kind: 'export' },
      { id: 'watch-metadata', title: 'Metadata', kind: 'metadata' },
      { id: 'watch-future', title: 'Future Extensions', kind: 'future-extensions' },
      { id: 'watch-preview', title: 'Preview', kind: 'preview' }
    ]
  }
};

const componentByBandKind: Partial<Record<BandKind, string>> = {
  'dial-face': 'dial-face',
  'chapter-ring': 'chapter-ring',
  'inner-bezel': 'inner-slide-rule',
  'outer-bezel': 'outer-slide-rule',
  'movement-template': 'dial-face',
  'scale-generator': 'chapter-ring',
  hands: 'hands',
  indices: 'hour-markers',
  text: 'dial-face',
  logo: 'logo',
  complications: 'complications'
};

export const defaultInspectorComponentId = 'dial-face';

export const listComponentInspectorSchemas = (): ComponentInspectorSchema[] => {
  return Object.values(componentSchemas);
};

export const getComponentInspectorSchema = (id: string): ComponentInspectorSchema => {
  const fallback = componentSchemas[defaultInspectorComponentId];
  if (!fallback) {
    throw new Error('Missing default inspector schema');
  }
  if (id.startsWith('watch-')) {
    return componentSchemas['watch-components'] ?? fallback;
  }
  return componentSchemas[id] ?? fallback;
};

export const resolveSelectedComponentId = (
  selectedBand: BandEntity | null,
  selectedComponentId: string | null
): string => {
  if (selectedComponentId && componentSchemas[selectedComponentId]) {
    return selectedComponentId;
  }

  if (selectedBand) {
    return componentByBandKind[selectedBand.kind] ?? defaultInspectorComponentId;
  }

  return defaultInspectorComponentId;
};

export const resolveHighlightBandIds = (
  bands: BandEntity[],
  selectedBandId: string | null,
  selectedComponentId: string | null
): string[] => {
  const selectedBand = bands.find((band) => band.id === selectedBandId) ?? null;
  const resolvedComponent = resolveSelectedComponentId(selectedBand, selectedComponentId);
  const schema = getComponentInspectorSchema(resolvedComponent);

  const linkedBandIds = bands
    .filter((band) => schema.linkedBandKinds.includes(band.kind))
    .map((band) => band.id);

  if (linkedBandIds.length > 0) {
    return linkedBandIds;
  }

  return selectedBandId ? [selectedBandId] : [];
};

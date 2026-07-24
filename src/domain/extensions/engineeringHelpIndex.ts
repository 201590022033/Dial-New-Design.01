export interface EngineeringHelpEntry {
  featureId: string;
  helpDocIds: string[];
}

export const engineeringHelpIndex: EngineeringHelpEntry[] = [
  { featureId: 'geometry-engine', helpDocIds: ['chapter-rings', 'recommended-tolerances'] },
  {
    featureId: 'scale-engine',
    helpDocIds: [
      'slide-rule-math',
      'tachymeter-math',
      'log-scales',
      'scale-linear',
      'scale-logarithmic',
      'scale-manufacturing'
    ]
  },
  { featureId: 'scale-plugin-tachymeter', helpDocIds: ['scale-tachymeter', 'tachymeter-math', 'scale-manufacturing'] },
  { featureId: 'scale-plugin-compass', helpDocIds: ['scale-compass', 'compass-scales', 'scale-manufacturing'] },
  { featureId: 'dial-face-generator', helpDocIds: ['chapter-rings', 'svg-guidelines'] },
  { featureId: 'dial-face-engine', helpDocIds: ['dial-face-engine', 'texture-engine', 'svg-guidelines'] },
  { featureId: 'chapter-ring-generator', helpDocIds: ['chapter-rings', 'compass-scales', 'countdown-rings'] },
  {
    featureId: 'chapter-ring-engine',
    helpDocIds: ['chapter-ring-engine', 'chapter-rings', 'scale-manufacturing', 'recommended-tolerances']
  },
  { featureId: 'bezel-generator', helpDocIds: ['bezels', 'compass-scales', 'countdown-rings'] },
  { featureId: 'bezel-engine', helpDocIds: ['bezel-engine', 'bezels', 'manufacturing'] },
  { featureId: 'texture-engine', helpDocIds: ['texture-engine', 'uv-printing', 'manufacturing'] },
  { featureId: 'typography-engine', helpDocIds: ['typography-engine', 'svg-guidelines', 'recommended-tolerances'] },
  { featureId: 'marker-engine', helpDocIds: ['marker-engine', 'chapter-rings', 'manufacturing'] },
  { featureId: 'lume-engine', helpDocIds: ['lume-engine', 'manufacturing', 'uv-printing'] },
  { featureId: 'movement-library', helpDocIds: ['manufacturing', 'recommended-tolerances'] },
  { featureId: 'movement-integration', helpDocIds: ['movement-integration', 'recommended-tolerances', 'cnc'] },
  { featureId: 'template-library', helpDocIds: ['template-library', 'dial-face-engine', 'movement-integration'] },
  { featureId: 'material-library', helpDocIds: ['uv-printing', 'laser-cutting', 'cnc'] },
  { featureId: 'manufacturing-engine', helpDocIds: ['manufacturing', 'laser-cutting', 'cnc'] },
  { featureId: 'export-engine', helpDocIds: ['svg-guidelines', 'recommended-tolerances', 'export-preview'] },
  { featureId: 'project-files', helpDocIds: ['project-files', 'svg-guidelines'] }
];

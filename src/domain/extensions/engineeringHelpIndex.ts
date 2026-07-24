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
  { featureId: 'chapter-ring-generator', helpDocIds: ['chapter-rings', 'compass-scales', 'countdown-rings'] },
  { featureId: 'bezel-generator', helpDocIds: ['bezels', 'compass-scales', 'countdown-rings'] },
  { featureId: 'movement-library', helpDocIds: ['manufacturing', 'recommended-tolerances'] },
  { featureId: 'material-library', helpDocIds: ['uv-printing', 'laser-cutting', 'cnc'] },
  { featureId: 'manufacturing-engine', helpDocIds: ['manufacturing', 'laser-cutting', 'cnc'] },
  { featureId: 'export-engine', helpDocIds: ['svg-guidelines', 'recommended-tolerances'] }
];

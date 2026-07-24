import type { GeometryParameterDefinition, GeometryUnits } from '@/domain/geometry/types';

const numericValidator = (min: number, max: number) => (value: number | GeometryUnits): boolean => {
  if (typeof value !== 'number') {
    return false;
  }
  return value >= min && value <= max;
};

export const geometryParameterDefinitions: GeometryParameterDefinition[] = [
  {
    key: 'caseDiameterMm',
    label: 'Case Diameter',
    defaultValue: 42,
    min: 20,
    max: 60,
    description: 'Master outer case diameter controlling the entire concentric geometry chain.',
    validate: numericValidator(20, 60)
  },
  {
    key: 'dialDiameterMm',
    label: 'Dial Diameter',
    defaultValue: 38,
    min: 15,
    max: 58,
    description: 'Active dial area constrained by the case interior.',
    validate: numericValidator(15, 58)
  },
  {
    key: 'movementDiameterMm',
    label: 'Movement Diameter',
    defaultValue: 30.5,
    min: 5,
    max: 45,
    description: 'Movement body diameter for compatibility checks and clearance validation.',
    validate: numericValidator(5, 45)
  },
  {
    key: 'movementCentreHoleMm',
    label: 'Movement Centre Hole',
    defaultValue: 1.5,
    min: 0.2,
    max: 6,
    description: 'Center arbor hole for hand stack and stem geometry reference.',
    validate: numericValidator(0.2, 6)
  },
  {
    key: 'bandClearanceMm',
    label: 'Band Clearance',
    defaultValue: 0.2,
    min: 0,
    max: 2,
    description: 'Safety clearance from case interior to nearest ring geometry.',
    validate: numericValidator(0, 2)
  },
  {
    key: 'bandGapMm',
    label: 'Band Gap',
    defaultValue: 0.15,
    min: 0,
    max: 2,
    description: 'Inter-band spacing used by the parametric diameter chain.',
    validate: numericValidator(0, 2)
  },
  {
    key: 'chapterRingWidthMm',
    label: 'Chapter Ring Width',
    defaultValue: 1.6,
    min: 0.2,
    max: 8,
    description: 'Radial width assigned to chapter ring geometry.',
    validate: numericValidator(0.2, 8)
  },
  {
    key: 'innerBezelWidthMm',
    label: 'Inner Bezel Width',
    defaultValue: 1.2,
    min: 0.2,
    max: 8,
    description: 'Radial width of inner bezel construction band.',
    validate: numericValidator(0.2, 8)
  },
  {
    key: 'outerBezelWidthMm',
    label: 'Outer Bezel Width',
    defaultValue: 1.5,
    min: 0.2,
    max: 8,
    description: 'Radial width of outer bezel construction band.',
    validate: numericValidator(0.2, 8)
  },
  {
    key: 'manufacturingToleranceMm',
    label: 'Manufacturing Tolerance',
    defaultValue: 0.05,
    min: 0,
    max: 1,
    description: 'Allowed dimensional tolerance for production workflows.',
    validate: numericValidator(0, 1)
  },
  {
    key: 'laserKerfMm',
    label: 'Laser Kerf',
    defaultValue: 0.08,
    min: 0,
    max: 1,
    description: 'Material removed by laser width used by manufacturing compensation checks.',
    validate: numericValidator(0, 1)
  },
  {
    key: 'minimumLineWidthMm',
    label: 'Minimum Line Width',
    defaultValue: 0.1,
    min: 0.01,
    max: 2,
    description: 'Minimum manufacturable line width across all generated graphics.',
    validate: numericValidator(0.01, 2)
  },
  {
    key: 'minimumTextHeightMm',
    label: 'Minimum Text Height',
    defaultValue: 1.4,
    min: 0.3,
    max: 10,
    description: 'Minimum text cap height for readability and process capability.',
    validate: numericValidator(0.3, 10)
  },
  {
    key: 'defaultUnits',
    label: 'Default Units',
    defaultValue: 'mm',
    min: null,
    max: null,
    description: 'Default engineering units for geometric calculations and labels.',
    validate: (value) => value === 'mm'
  }
];

export const getGeometryParameterDefinition = (key: GeometryParameterDefinition['key']) => {
  return geometryParameterDefinitions.find((definition) => definition.key === key) ?? null;
};

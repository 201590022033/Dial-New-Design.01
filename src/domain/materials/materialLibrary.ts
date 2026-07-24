export interface MaterialDefinition {
  id: string;
  name: string;
  defaultThicknessMm: number;
  laserSuitable: boolean;
  uvSuitable: boolean;
  cncSuitable: boolean;
  colorOptions: string[];
  minimumEngravingWidthMm: number;
  recommendedToleranceMm: number;
  manufacturingNotes: string;
}

export const materialLibrary: MaterialDefinition[] = [
  {
    id: 'brass',
    name: 'Brass',
    defaultThicknessMm: 0.4,
    laserSuitable: true,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['gold', 'champagne', 'black'],
    minimumEngravingWidthMm: 0.12,
    recommendedToleranceMm: 0.05,
    manufacturingNotes: 'Stable for dial blanks, requires anti-oxidation handling before coating.'
  },
  {
    id: 'copper',
    name: 'Copper',
    defaultThicknessMm: 0.45,
    laserSuitable: true,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['copper', 'rose', 'brown'],
    minimumEngravingWidthMm: 0.14,
    recommendedToleranceMm: 0.06,
    manufacturingNotes: 'Soft substrate; use reduced feed rates to avoid burr.'
  },
  {
    id: 'steel',
    name: 'Stainless Steel',
    defaultThicknessMm: 0.35,
    laserSuitable: true,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['silver', 'gunmetal', 'black'],
    minimumEngravingWidthMm: 0.15,
    recommendedToleranceMm: 0.05,
    manufacturingNotes: 'Excellent stiffness, ensure tool wear compensation.'
  },
  {
    id: 'titanium',
    name: 'Titanium',
    defaultThicknessMm: 0.35,
    laserSuitable: false,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['titanium-grey', 'black'],
    minimumEngravingWidthMm: 0.2,
    recommendedToleranceMm: 0.04,
    manufacturingNotes: 'Requires careful heat management and specialist tooling.'
  },
  {
    id: 'aluminium',
    name: 'Aluminium',
    defaultThicknessMm: 0.4,
    laserSuitable: true,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['silver', 'blue', 'red', 'black'],
    minimumEngravingWidthMm: 0.12,
    recommendedToleranceMm: 0.06,
    manufacturingNotes: 'Fast prototyping substrate with good UV print adhesion.'
  },
  {
    id: 'carbon-fibre',
    name: 'Carbon Fibre',
    defaultThicknessMm: 0.6,
    laserSuitable: false,
    uvSuitable: true,
    cncSuitable: true,
    colorOptions: ['black-weave', 'grey-weave'],
    minimumEngravingWidthMm: 0.25,
    recommendedToleranceMm: 0.08,
    manufacturingNotes: 'Use mechanical finishing to protect weave and resin matrix.'
  },
  {
    id: 'ceramic',
    name: 'Ceramic',
    defaultThicknessMm: 0.5,
    laserSuitable: false,
    uvSuitable: false,
    cncSuitable: false,
    colorOptions: ['white', 'black', 'blue'],
    minimumEngravingWidthMm: 0.2,
    recommendedToleranceMm: 0.07,
    manufacturingNotes: 'Brittle material; avoid sharp internal corners.'
  },
  {
    id: 'enamel',
    name: 'Enamel',
    defaultThicknessMm: 0.2,
    laserSuitable: false,
    uvSuitable: true,
    cncSuitable: false,
    colorOptions: ['white', 'black', 'ivory', 'blue'],
    minimumEngravingWidthMm: 0.16,
    recommendedToleranceMm: 0.09,
    manufacturingNotes: 'Apply in layers with controlled curing to avoid cracking.'
  }
];

export const materialById = (id: string): MaterialDefinition | null => {
  return materialLibrary.find((material) => material.id === id) ?? null;
};

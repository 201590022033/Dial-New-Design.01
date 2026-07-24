export interface MaterialDefinition {
  id: string;
  name: string;
  defaultThicknessMm: number;
  laserSuitable: boolean;
  uvSuitable: boolean;
  minimumEngravingWidthMm: number;
  manufacturingNotes: string;
}

export const materialLibrary: MaterialDefinition[] = [
  {
    id: 'brass',
    name: 'Brass',
    defaultThicknessMm: 0.4,
    laserSuitable: true,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.12,
    manufacturingNotes: 'Stable for dial blanks, requires anti-oxidation handling before coating.'
  },
  {
    id: 'copper',
    name: 'Copper',
    defaultThicknessMm: 0.45,
    laserSuitable: true,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.14,
    manufacturingNotes: 'Soft substrate; use reduced feed rates to avoid burr.'
  },
  {
    id: 'steel',
    name: 'Steel',
    defaultThicknessMm: 0.35,
    laserSuitable: true,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.15,
    manufacturingNotes: 'Excellent stiffness, ensure tool wear compensation.'
  },
  {
    id: 'titanium',
    name: 'Titanium',
    defaultThicknessMm: 0.35,
    laserSuitable: false,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.2,
    manufacturingNotes: 'Requires careful heat management and specialist tooling.'
  },
  {
    id: 'aluminium',
    name: 'Aluminium',
    defaultThicknessMm: 0.4,
    laserSuitable: true,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.12,
    manufacturingNotes: 'Fast prototyping substrate with good UV print adhesion.'
  },
  {
    id: 'carbon-fibre',
    name: 'Carbon Fibre',
    defaultThicknessMm: 0.6,
    laserSuitable: false,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.25,
    manufacturingNotes: 'Use mechanical finishing to protect weave and resin matrix.'
  },
  {
    id: 'ceramic',
    name: 'Ceramic',
    defaultThicknessMm: 0.5,
    laserSuitable: false,
    uvSuitable: false,
    minimumEngravingWidthMm: 0.2,
    manufacturingNotes: 'Brittle material; avoid sharp internal corners.'
  },
  {
    id: 'enamel',
    name: 'Enamel',
    defaultThicknessMm: 0.2,
    laserSuitable: false,
    uvSuitable: true,
    minimumEngravingWidthMm: 0.16,
    manufacturingNotes: 'Apply in layers with controlled curing to avoid cracking.'
  }
];

export const materialById = (id: string): MaterialDefinition | null => {
  return materialLibrary.find((material) => material.id === id) ?? null;
};

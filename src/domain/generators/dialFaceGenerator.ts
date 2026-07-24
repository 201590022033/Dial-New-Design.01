import type { ScaleKind } from '@/domain/scales/types';

export interface DialFaceElement {
  id: string;
  kind:
    | 'applied-index'
    | 'printed-index'
    | 'arabic-numeral'
    | 'roman-numeral'
    | 'pilot-font'
    | 'railroad-track'
    | 'minute-track'
    | 'chapter-track'
    | 'logo'
    | 'brand-text'
    | 'date-window'
    | 'subdial'
    | 'power-reserve'
    | 'moonphase-placeholder'
    | 'open-heart-placeholder'
    | 'skeleton-placeholder'
    | 'guilloche-placeholder'
    | 'sunburst-placeholder'
    | 'carbon-fibre-placeholder';
  description: string;
}

export interface DialFacePlan {
  scaleAttachments: ScaleKind[];
  elements: DialFaceElement[];
}

export const createDialFacePlan = (): DialFacePlan => {
  return {
    scaleAttachments: ['circular', 'custom'],
    elements: [
      { id: 'df-applied-indices', kind: 'applied-index', description: 'Applied metal indices scaffold.' },
      { id: 'df-printed-indices', kind: 'printed-index', description: 'Printed index layout scaffold.' },
      { id: 'df-arabic', kind: 'arabic-numeral', description: 'Arabic numeral markers scaffold.' },
      { id: 'df-roman', kind: 'roman-numeral', description: 'Roman numeral markers scaffold.' },
      { id: 'df-pilot', kind: 'pilot-font', description: 'Pilot typography placeholder.' },
      { id: 'df-railroad', kind: 'railroad-track', description: 'Railroad minute track placeholder.' },
      { id: 'df-minute-track', kind: 'minute-track', description: 'Minute track generator placeholder.' },
      { id: 'df-chapter-track', kind: 'chapter-track', description: 'Chapter track placeholder.' },
      { id: 'df-logo', kind: 'logo', description: 'Logo placement placeholder.' },
      { id: 'df-brand-text', kind: 'brand-text', description: 'Brand text placement placeholder.' },
      { id: 'df-date-window', kind: 'date-window', description: 'Date window geometry placeholder.' },
      { id: 'df-subdial', kind: 'subdial', description: 'Subdial placement placeholder.' },
      { id: 'df-power-reserve', kind: 'power-reserve', description: 'Power reserve indicator placeholder.' },
      { id: 'df-moonphase', kind: 'moonphase-placeholder', description: 'Moonphase placeholder.' },
      { id: 'df-open-heart', kind: 'open-heart-placeholder', description: 'Open-heart aperture placeholder.' },
      { id: 'df-skeleton', kind: 'skeleton-placeholder', description: 'Skeletonized region placeholder.' },
      { id: 'df-guilloche', kind: 'guilloche-placeholder', description: 'Guilloche texture placeholder.' },
      { id: 'df-sunburst', kind: 'sunburst-placeholder', description: 'Sunburst finish placeholder.' },
      { id: 'df-carbon', kind: 'carbon-fibre-placeholder', description: 'Carbon fibre texture placeholder.' }
    ]
  };
};

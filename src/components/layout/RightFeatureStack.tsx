import type { ReactNode } from 'react';
import { BookOpenCheck, Palette, ScrollText, Shapes, Wrench } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';

interface PlaceholderPanel {
  title: string;
  icon: ReactNode;
  description: string;
}

const placeholderPanels: PlaceholderPanel[] = [
  {
    title: 'Scale Generator',
    icon: <Shapes className="ds-icon-sm text-engineering-teal" />,
    description: 'Template groups for tachymeter, compass, countdown, and future logarithmic scales.'
  },
  {
    title: 'Engineering Help',
    icon: <BookOpenCheck className="ds-icon-sm text-engineering-amber" />,
    description: 'Guided references for ring construction, manufacturing constraints and SVG production notes.'
  },
  {
    title: 'Texture Browser',
    icon: <Palette className="ds-icon-sm text-engineering-teal" />,
    description: 'Placeholder material swatches for matte, sunburst, brushed and enamel overlays.'
  },
  {
    title: 'Movement Browser',
    icon: <Wrench className="ds-icon-sm text-engineering-amber" />,
    description: 'Movement templates list with sizing presets, dial feet positions and export metadata.'
  },
  {
    title: 'Export Preview',
    icon: <ScrollText className="ds-icon-sm text-engineering-teal" />,
    description: 'Live preflight surface for SVG/DXF/PDF/PNG validation and technical output checks.'
  },
  {
    title: 'Material Library',
    icon: <Palette className="ds-icon-sm text-engineering-amber" />,
    description: 'Preset card deck for brass, steel, lume paints and prototype finishing combinations.'
  }
];

export const RightFeatureStack = () => {
  return (
    <div className="space-y-3 overflow-auto pr-1">
      {placeholderPanels.map((panel) => (
        <Panel key={panel.title} className="p-3">
          <div className="flex items-center gap-2">
            {panel.icon}
            <h3 className="ds-panel-title text-engineering-text">{panel.title}</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-engineering-muted">{panel.description}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-[10px] text-engineering-muted">
              Ready
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-[10px] text-engineering-muted">
              Placeholder
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-[10px] text-engineering-muted">
              Extensible
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
};

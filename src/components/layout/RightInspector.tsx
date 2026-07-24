import { useMemo } from 'react';
import { CircleDot, DraftingCompass, SlidersHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { dialDimensionsSchema, type DialDimensionsInput } from '@/hooks/useDialValidation';
import { useGlobalSettingsStore, useBandsStore, useSelectionStore } from '@/stores';
import type { BandKind } from '@/domain/bands/types';

const inspectorByBand: Record<BandKind, string[]> = {
  'dial-face': [
    'General',
    'Geometry',
    'Finish',
    'Texture',
    'Guilloche',
    'Indices',
    'Colours',
    'Lume',
    'Text',
    'Logo',
    'Cut-outs',
    'Export'
  ],
  'chapter-ring': [
    'Geometry',
    'Scale Generator',
    'Typography',
    'Slide Rule',
    'Tachymeter',
    'Compass',
    'Countdown',
    'Manufacturing'
  ],
  'inner-bezel': ['Geometry', 'Scale Generator', 'Slide Rule', 'Countdown', 'Manufacturing'],
  'outer-bezel': ['Geometry', 'Scale Generator', 'Tachymeter', 'Compass', 'Manufacturing'],
  'movement-template': ['General', 'Movement Browser', 'Manufacturing'],
  'scale-generator': ['Scale Generator', 'Typography', 'Manufacturing'],
  hands: ['General', 'Geometry', 'Manufacturing'],
  indices: ['General', 'Geometry', 'Typography', 'Lume', 'Manufacturing'],
  text: ['General', 'Typography', 'Colours', 'Manufacturing'],
  logo: ['General', 'Geometry', 'Colours', 'Manufacturing'],
  complications: ['General', 'Geometry', 'Cut-outs', 'Manufacturing']
};

export const RightInspector = () => {
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const bands = useBandsStore((s) => s.bands);
  const setCaseDiameter = useGlobalSettingsStore((s) => s.setCaseDiameter);
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);

  const selected = useMemo(() => bands.find((b) => b.id === selectedBandId), [bands, selectedBandId]);

  const form = useForm<DialDimensionsInput>({
    resolver: zodResolver(dialDimensionsSchema),
    defaultValues: {
      caseDiameterMm,
      innerRadiusMm: selected?.geometry.innerRadius ?? 0,
      outerRadiusMm: selected?.geometry.outerRadius ?? caseDiameterMm / 2
    }
  });

  return (
    <Panel className="h-full p-3">
      <h2 className="mb-3 flex items-center justify-between gap-2">
        <span className="ds-panel-title flex items-center gap-2">
          <SlidersHorizontal className="ds-icon-md text-engineering-amber" /> Inspector
        </span>
        <span className="ds-badge border-engineering-amber/45 bg-engineering-amber/10 text-engineering-amber">
          {selected ? selected.displayName : 'No Selection'}
        </span>
      </h2>

      <div className="space-y-3 overflow-auto pr-1">
        <CollapsibleCard title="Global Geometry" accent="amber">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit((values) => {
                setCaseDiameter(values.caseDiameterMm);
              })(event);
            }}
          >
            <label className="ds-label-inspector block" htmlFor="caseDiameterMm">
              Total Case Diameter (mm)
            </label>
            <input
              id="caseDiameterMm"
              type="number"
              step="0.1"
              className="ds-input"
              {...form.register('caseDiameterMm', { valueAsNumber: true })}
            />
            <Button variant="primary" className="w-full" type="submit">
              Apply Master Dimension
            </Button>
          </form>
        </CollapsibleCard>

        {(selected ? inspectorByBand[selected.kind] : ['General']).map((sectionTitle) => (
          <CollapsibleCard
            key={sectionTitle}
            title={sectionTitle}
            defaultOpen={sectionTitle === 'General' || sectionTitle === 'Geometry'}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-engineering-muted">
                <CircleDot className="ds-icon-sm text-engineering-teal" />
                Placeholder settings surface for {sectionTitle.toLowerCase()}.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <p className="ds-label-inspector">Preset</p>
                  <p className="mt-1 text-xs text-engineering-text">Engineering Default</p>
                </div>
                <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <p className="ds-label-inspector">Status</p>
                  <p className="mt-1 text-xs text-engineering-amber">Planned</p>
                </div>
              </div>
              <Button variant="inspector" size="sm" className="w-full justify-center">
                <DraftingCompass className="ds-icon-sm" /> Open {sectionTitle} Tools
              </Button>
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </Panel>
  );
};

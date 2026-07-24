import { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Panel } from '@/components/ui/Panel';
import { dialDimensionsSchema, type DialDimensionsInput } from '@/hooks/useDialValidation';
import { useGlobalSettingsStore, useBandsStore, useSelectionStore } from '@/stores';

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
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-engineering-muted">
        <SlidersHorizontal className="h-4 w-4 text-engineering-amber" /> Inspector
      </h2>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit((values) => {
            setCaseDiameter(values.caseDiameterMm);
          })(event);
        }}
      >
        <label className="block text-xs uppercase tracking-wide text-engineering-muted" htmlFor="caseDiameterMm">
          Case Diameter (mm)
        </label>
        <input
          id="caseDiameterMm"
          type="number"
          step="0.1"
          className="w-full rounded-md border border-engineering-border bg-engineering-bg/70 px-3 py-2 text-sm"
          {...form.register('caseDiameterMm', { valueAsNumber: true })}
        />
        <button
          type="submit"
          className="w-full rounded-md border border-engineering-amber/80 bg-engineering-amber/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-engineering-amber shadow-glowAmber"
        >
          Apply Global Settings
        </button>
      </form>
    </Panel>
  );
};

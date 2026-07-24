import { Layers3 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { useBandsStore, useSelectionStore } from '@/stores';

export const LeftBandsPanel = () => {
  const bands = useBandsStore((s) => s.bands);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const selectBand = useSelectionStore((s) => s.selectBand);

  return (
    <Panel className="flex h-full flex-col p-3">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-engineering-muted">
        <Layers3 className="h-4 w-4 text-engineering-teal" /> Bands
      </h2>
      <div className="space-y-2 overflow-auto">
        {bands.map((band) => (
          <button
            type="button"
            key={band.id}
            onClick={() => selectBand(band.id)}
            className={`w-full rounded-md border p-2 text-left text-sm transition-colors ${
              selectedBandId === band.id
                ? 'border-engineering-teal/70 bg-engineering-teal/10 text-engineering-text'
                : 'border-engineering-border bg-engineering-bg/40 text-engineering-muted hover:border-engineering-amber/60 hover:text-engineering-text'
            }`}
          >
            <p className="font-medium">{band.name}</p>
            <p className="font-mono text-xs">
              {band.geometry.innerRadius.toFixed(2)} - {band.geometry.outerRadius.toFixed(2)} mm
            </p>
          </button>
        ))}
      </div>
    </Panel>
  );
};

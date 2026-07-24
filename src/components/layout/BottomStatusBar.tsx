import { BadgeCheck, Focus, ZoomIn } from 'lucide-react';
import { useBandsStore, useSelectionStore, useViewportStore } from '@/stores';

export const BottomStatusBar = () => {
  const zoom = useViewportStore((s) => s.zoom);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const bands = useBandsStore((s) => s.bands);

  const selected = bands.find((b) => b.id === selectedBandId);

  return (
    <footer className="grid grid-cols-1 items-center gap-2 rounded-panel border border-engineering-border bg-engineering-panel/80 p-3 text-xs text-engineering-muted shadow-panel md:grid-cols-3">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-engineering-teal" />
        Parametric mode active
      </div>
      <div className="flex items-center gap-2 md:justify-center">
        <ZoomIn className="h-4 w-4 text-engineering-amber" />
        Zoom {Math.round(zoom * 100)}%
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Focus className="h-4 w-4 text-engineering-teal" />
        {selected ? `Selected: ${selected.name}` : 'Selected: None'}
      </div>
    </footer>
  );
};

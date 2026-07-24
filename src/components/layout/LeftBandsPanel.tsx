import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Eye, EyeOff, GripVertical, Layers3, Lock, LockOpen } from 'lucide-react';
import type { BandEntity } from '@/domain/bands/types';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { useBandsStore, useSelectionStore } from '@/stores';
import { cn } from '@/utils/cn';

interface DragBandItem {
  type: 'active-band';
  id: string;
  index: number;
}

const futureLayers = ['Hands', 'Indices', 'Text', 'Logo', 'Complications'];

const modeByKind: Record<BandEntity['kind'], string> = {
  'dial-face': 'Base Layer',
  'chapter-ring': 'Track Layout',
  'inner-bezel': 'Slide Rule Mode',
  'outer-bezel': 'Coin Edge',
  'movement-template': 'NH31 Placeholder',
  'scale-generator': 'Template Track',
  hands: 'Hand Stack',
  indices: 'Marker Layout',
  text: 'Typography',
  logo: 'Brand Mark',
  complications: 'Complication Seats'
};

const statusByKind: Record<BandEntity['kind'], string> = {
  'dial-face': 'Ready',
  'chapter-ring': 'Ready',
  'inner-bezel': 'Draft',
  'outer-bezel': 'Draft',
  'movement-template': 'Linked',
  'scale-generator': 'Planned',
  hands: 'Planned',
  indices: 'Planned',
  text: 'Planned',
  logo: 'Planned',
  complications: 'Planned'
};

interface BandRowProps {
  band: BandEntity;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

const BandRow = ({
  band,
  index,
  selected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onMove
}: BandRowProps) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop<DragBandItem>({
    accept: 'active-band',
    hover: (item) => {
      if (item.index === index) {
        return;
      }
      onMove(item.index, index);
      item.index = index;
    }
  });

  const [{ isDragging }, drag] = useDrag<DragBandItem, unknown, { isDragging: boolean }>({
    type: 'active-band',
    item: { type: 'active-band', id: band.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  drag(drop(rowRef));

  return (
    <div
      ref={rowRef}
      className={cn(
        'ds-transition rounded-lg border p-2',
        selected
          ? 'border-engineering-teal/70 bg-engineering-teal/10 shadow-glowTeal'
          : 'border-engineering-border bg-engineering-bg/45 hover:border-engineering-amber/50',
        isDragging && 'opacity-55'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="ds-focus-ring flex min-w-0 flex-1 items-start gap-2 rounded-md text-left"
        >
          <GripVertical className="mt-0.5 ds-icon-sm text-engineering-muted" />
          <span
            className="mt-1 inline-flex h-3 w-3 shrink-0 rounded-full border border-white/10"
            style={{ backgroundColor: band.style.fill }}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-engineering-text">{band.displayName}</span>
            <span className="block text-[11px] text-engineering-muted">{modeByKind[band.kind]}</span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="icon" size="sm" onClick={onToggleVisibility} aria-label="Toggle visibility">
            {band.visible ? <Eye className="ds-icon-sm" /> : <EyeOff className="ds-icon-sm" />}
          </Button>
          <Button variant="icon" size="sm" onClick={onToggleLock} aria-label="Toggle lock">
            {band.locked ? <Lock className="ds-icon-sm" /> : <LockOpen className="ds-icon-sm" />}
          </Button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-engineering-muted">
        <span>Type: {band.kind}</span>
        <span>Width: {band.calculatedWidthMm.toFixed(2)}mm</span>
        <span>Status: {statusByKind[band.kind]}</span>
      </div>
    </div>
  );
};

export const LeftBandsPanel = () => {
  const bands = useBandsStore((s) => s.bands);
  const updateBand = useBandsStore((s) => s.updateBand);
  const reorderBands = useBandsStore((s) => s.reorderBands);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const selectBand = useSelectionStore((s) => s.selectBand);

  return (
    <Panel className="flex h-full flex-col p-3">
      <h2 className="mb-3 flex items-center justify-between gap-2">
        <span className="ds-panel-title flex items-center gap-2">
          <Layers3 className="ds-icon-md text-engineering-teal" /> ACTIVE BANDS
        </span>
        <span className="ds-badge border-engineering-teal/40 bg-engineering-teal/10 text-engineering-teal">
          {bands.length} Layers
        </span>
      </h2>

      <div className="space-y-2 overflow-auto pr-1">
        {bands.map((band, index) => (
          <BandRow
            key={band.id}
            band={band}
            index={index}
            selected={selectedBandId === band.id}
            onSelect={() => selectBand(band.id)}
            onToggleLock={() => updateBand(band.id, (entry) => ({ ...entry, locked: !entry.locked }))}
            onToggleVisibility={() =>
              updateBand(band.id, (entry) => ({ ...entry, visible: !entry.visible }))
            }
            onMove={reorderBands}
          />
        ))}
      </div>

      <div className="ds-divider my-3" />
      <div className="space-y-2">
        <p className="ds-label-inspector">Future Layers</p>
        <div className="grid grid-cols-2 gap-2">
          {futureLayers.map((layer) => (
            <div
              key={layer}
              className="rounded-md border border-dashed border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-[11px] text-engineering-muted"
            >
              {layer}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

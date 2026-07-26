import { Crosshair, Grid3X3, MousePointer2, Move, Ruler, ZoomIn } from 'lucide-react';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import {
  useBandsStore,
  useDesignEngineStore,
  useGlobalSettingsStore,
  useScaleStore,
  useSelectionStore,
  useViewportStore
} from '@/stores';

export const BottomStatusBar = () => {
  const zoom = useViewportStore((s) => s.zoom);
  const showSnapping = useViewportStore((s) => s.showSnapping);
  const mouseX = useViewportStore((s) => s.mouseX);
  const mouseY = useViewportStore((s) => s.mouseY);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const bands = useBandsStore((s) => s.bands);
  const warnings = useBandsStore((s) => s.warnings);
  const manufacturingWarnings = useBandsStore((s) => s.manufacturingWarnings);
  const validationResults = useBandsStore((s) => s.validationResults);
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const units = useGlobalSettingsStore((s) => s.units);
  const scalePreview = useScaleStore((s) => s.preview);
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const engineeringReadout = useScaleStore((s) => s.engineeringReadout);
  const scaleValidation = useScaleStore((s) => s.validation);
  const activeTemplateId = useDesignEngineStore((s) => s.activeTemplateId);
  const selectedMovementId = useDesignEngineStore((s) => s.selectedMovementId);
  const lumeMode = useDesignEngineStore((s) => s.lumeResult.mode);
  const collisionWarnings = useDesignEngineStore((s) => s.collisionWarnings);

  const selected = bands.find((b) => b.id === selectedBandId);
  const movement = movementLibrary.find((entry) => entry.id === selectedMovementId) ?? movementLibrary[0];
  const validationErrors = validationResults.filter((entry) => entry.severity === 'error').length;
  const geometryStatus = validationErrors > 0 ? 'Attention' : 'Healthy';
  const currentScale = scalePreview?.pluginName ?? (selected?.kind === 'scale-generator' ? 'Custom Scale' : 'Circular');

  return (
    <footer className="ds-panel grid grid-cols-1 gap-2 px-3 py-2 text-xs text-engineering-muted xl:grid-cols-12">
      <div className="flex items-center gap-1.5">
        <MousePointer2 className="ds-icon-sm text-engineering-teal" />
        <span className="ds-label-status">Mouse</span>
        <span className="font-mono text-engineering-text">
          {mouseX.toFixed(0)}, {mouseY.toFixed(0)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <ZoomIn className="ds-icon-sm text-engineering-amber" />
        <span className="ds-label-status">Zoom</span>
        <span className="font-mono text-engineering-text">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Grid3X3 className="ds-icon-sm text-engineering-teal" />
        <span className="ds-label-status">Grid</span>
        <span className="font-mono text-engineering-text">0.10mm</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Move className="ds-icon-sm text-engineering-amber" />
        <span className="ds-label-status">Snap</span>
        <span className="font-mono text-engineering-text">{showSnapping ? 'On' : 'Off'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Ruler className="ds-icon-sm text-engineering-teal" />
        <span className="ds-label-status">Units</span>
        <span className="font-mono text-engineering-text">{units}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Crosshair className="ds-icon-sm text-engineering-amber" />
        <span className="ds-label-status">Movement</span>
        <span className="font-mono text-engineering-text">{movement?.name ?? 'None'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Band</span>
        <span className="font-mono text-engineering-text">{selected ? selected.displayName : 'None'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Band Width</span>
        <span className="font-mono text-engineering-text">
          {selected ? `${selected.calculatedWidthMm.toFixed(2)}mm` : '--'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Tool</span>
        <span className="font-mono text-engineering-text">Select</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Scale</span>
        <span className="font-mono text-engineering-text">{currentScale}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Scale Validation</span>
        <span className="font-mono text-engineering-text">
          {scaleValidation ? (scaleValidation.valid ? 'OK' : `${scaleValidation.warnings.length} warning(s)`) : 'Idle'}
        </span>
      </div>
      {selectedScaleKind === 'slide-rule' ? (
        <div className="flex items-center gap-1.5">
          <span className="ds-label-status">Readout</span>
          <span className="font-mono text-engineering-text">
            {engineeringReadout
              ? `${engineeringReadout.ringId} ${engineeringReadout.value.toFixed(4)} @ ${engineeringReadout.angleDeg.toFixed(2)}deg`
              : 'Idle'}
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Geometry</span>
        <span className="font-mono text-engineering-text">{geometryStatus}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Validation</span>
        <span className="font-mono text-engineering-text">
          {validationErrors > 0 ? `${validationErrors} error(s)` : 'OK'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Template</span>
        <span className="font-mono text-engineering-text">{activeTemplateId}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Lume</span>
        <span className="font-mono text-engineering-text">{lumeMode}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Manufacturing</span>
        <span className="font-mono text-engineering-text">{manufacturingWarnings.length} warning(s)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Collisions</span>
        <span className="font-mono text-engineering-text">{collisionWarnings.length} warning(s)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="ds-label-status">Constraints</span>
        <span className="font-mono text-engineering-text">{warnings.length} warning(s)</span>
      </div>
      <div className="flex items-center gap-1.5 xl:justify-end">
        <span className="ds-label-status">Case</span>
        <span className="font-mono text-engineering-amber">{caseDiameterMm.toFixed(1)}mm</span>
      </div>
    </footer>
  );
};

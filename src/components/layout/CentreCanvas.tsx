import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Focus, Maximize2, Minimize2, Move, Ruler, ScanLine, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useRenderer } from '@/renderer/useRenderer';
import { nextZoomValue } from '@/renderer/services/zoomService';
import { createPanState, resolvePan, type PanState } from '@/renderer/services/panService';
import { resolveHighlightBandIds } from '@/features/shared/objectInspectorSchemas';
import { useBandsStore, useDesignEngineStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';
import { mmToPixels } from '@/utils/math';

interface CentreCanvasProps {
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const CentreCanvas = ({ presentationMode, onTogglePresentationMode }: CentreCanvasProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const bands = useBandsStore((s) => s.bands);
  const zoom = useViewportStore((s) => s.zoom);
  const panX = useViewportStore((s) => s.panX);
  const panY = useViewportStore((s) => s.panY);
  const showGuides = useViewportStore((s) => s.showGuides);
  const showSnapping = useViewportStore((s) => s.showSnapping);
  const scalePreview = useScaleStore((s) => s.preview);
  const designOverlay = useDesignEngineStore((s) => s.overlay);
  const setZoom = useViewportStore((s) => s.setZoom);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const selectedComponentId = useSelectionStore((s) => s.selectedComponentId);
  const selectBand = useSelectionStore((s) => s.selectBand);
  const hoverBand = useSelectionStore((s) => s.hoverBand);
  const panBy = useViewportStore((s) => s.panBy);
  const resetPan = useViewportStore((s) => s.resetPan);
  const setMousePosition = useViewportStore((s) => s.setMousePosition);
  const toggleGuides = useViewportStore((s) => s.toggleGuides);

  const renderer = useRenderer(container);
  const { width, height } = useResizeObserver(container);
  const panState = useRef<PanState | null>(null);
  const lastPan = useRef({ x: panX, y: panY });

  useEffect(() => {
    lastPan.current = { x: panX, y: panY };
  }, [panX, panY]);

  const renderContext = useMemo(
    () => ({
      width,
      height,
      centerX: width / 2,
      centerY: height / 2,
      zoom,
      panX,
      panY
    }),
    [width, height, zoom, panX, panY]
  );

  const highlightedBandIds = useMemo(
    () => resolveHighlightBandIds(bands, selectedBandId, selectedComponentId),
    [bands, selectedBandId, selectedComponentId]
  );

  const fitMetrics = useMemo(() => {
    const maxOuterRadiusMm = bands.reduce((current, band) => Math.max(current, band.geometry.outerRadius), 20);
    const nominalDiameterPx = Math.max(1, mmToPixels(maxOuterRadiusMm * 2));
    const minDimension = Math.max(1, Math.min(width, height));
    const fitToWatchScale = Math.max(1, Math.min(2.6, (minDimension * 0.9) / nominalDiameterPx));
    const fitWidthScale = Math.max(1, Math.min(2.6, (Math.max(1, width) * 0.94) / nominalDiameterPx));

    return {
      fitToWatchZoom: 1,
      fitWidthZoom: Number((fitWidthScale / fitToWatchScale).toFixed(2)),
      actualSizeZoom: Number((1 / fitToWatchScale).toFixed(2))
    };
  }, [bands, width, height]);

  const fitToWatch = () => {
    resetPan();
    setZoom(fitMetrics.fitToWatchZoom);
  };

  const fitWidth = () => {
    resetPan();
    setZoom(fitMetrics.fitWidthZoom);
  };

  const actualSize = () => {
    resetPan();
    setZoom(fitMetrics.actualSizeZoom);
  };

  useEffect(() => {
    renderer.renderBands(bands, renderContext, {
      showGuides: presentationMode ? false : showGuides,
      showSnapping,
      scalePreview,
      designOverlay,
      highlightedBandIds
    });
  }, [
    renderer,
    bands,
    renderContext,
    showGuides,
    showSnapping,
    scalePreview,
    designOverlay,
    highlightedBandIds,
    presentationMode
  ]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={[
        'relative h-full w-full overflow-hidden rounded-panel border border-engineering-border shadow-panel',
        presentationMode ? 'bg-[#edf0f4]' : 'bg-engineering-bg/85',
        presentationMode ? 'max-w-[1420px]' : 'max-w-[1320px]'
      ].join(' ')}
    >
      <div
        ref={setContainer}
        className={[
          'h-full w-full cursor-crosshair overflow-hidden rounded-panel',
          showGrid && !presentationMode ? 'bg-grid bg-[size:62px_62px]' : ''
        ].join(' ')}
        onWheel={(event) => {
          event.preventDefault();

          const targetRect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - targetRect.left;
          const relativeY = event.clientY - targetRect.top;
          const fromCenterX = relativeX - renderContext.centerX;
          const fromCenterY = relativeY - renderContext.centerY;

          const nextZoom = nextZoomValue(zoom, event.deltaY);
          const currentPan = lastPan.current;

          if (nextZoom === zoom) {
            return;
          }

          const nextPanX = fromCenterX - ((fromCenterX - currentPan.x) / zoom) * nextZoom;
          const nextPanY = fromCenterY - ((fromCenterY - currentPan.y) / zoom) * nextZoom;

          panBy(nextPanX - currentPan.x, nextPanY - currentPan.y);
          lastPan.current = { x: nextPanX, y: nextPanY };
          setZoom(nextZoom);
        }}
        onMouseDown={(event) => {
          if (event.button !== 1 && event.button !== 0) return;
          if (event.button === 1 || event.shiftKey) {
            panState.current = createPanState(event.clientX, event.clientY, panX, panY);
          }
        }}
        onMouseMove={(event) => {
          const targetRect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - targetRect.left;
          const relativeY = event.clientY - targetRect.top;
          setMousePosition(relativeX, relativeY);

          if (panState.current) {
            const next = resolvePan(panState.current, event.clientX, event.clientY);
            const dx = next.x - lastPan.current.x;
            const dy = next.y - lastPan.current.y;
            if (dx !== 0 || dy !== 0) {
              panBy(dx, dy);
              lastPan.current = next;
            }
            return;
          }

          const hit = renderer.hitTest(event.clientX, event.clientY);
          hoverBand(hit);
        }}
        onMouseUp={(event) => {
          if (panState.current) {
            panState.current = null;
            return;
          }
          if (event.button === 0) {
            const hit = renderer.hitTest(event.clientX, event.clientY);
            selectBand(hit);
          }
        }}
        onMouseLeave={() => {
          panState.current = null;
          hoverBand(null);
          setMousePosition(0, 0);
        }}
        onDoubleClick={() => {
          fitToWatch();
        }}
      />

      {presentationMode ? null : (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-engineering-amber/8" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-engineering-teal/8" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-engineering-teal/8" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-engineering-teal/8" />
        </>
      )}

      {presentationMode ? null : (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-engineering-border bg-engineering-panel/78 px-2 py-1 font-mono text-xs text-engineering-muted">
          Wheel Zoom to Cursor | Shift+Drag Pan | Double Click Fit to Watch
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-engineering-border bg-engineering-panel/90 px-2 py-1 shadow-panel">
        <Button variant="status" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}>
          <ZoomOut className="ds-icon-sm" />
        </Button>
        <span className="min-w-16 text-center font-mono text-xs text-engineering-muted">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="status" size="sm" onClick={() => setZoom(Math.min(8, zoom + 0.1))}>
          <ZoomIn className="ds-icon-sm" />
        </Button>
        <Button variant="status" size="sm" onClick={fitToWatch}>
          <Focus className="ds-icon-sm" /> Fit
        </Button>
        <Button variant="status" size="sm" onClick={fitWidth}>
          <ScanLine className="ds-icon-sm" /> Fit Width
        </Button>
        <Button variant="status" size="sm" onClick={actualSize}>
          1:1
        </Button>
        {presentationMode ? null : (
          <>
            <Button variant="status" size="sm" active={showGuides} onClick={toggleGuides}>
              Guides
            </Button>
            <Button variant="status" size="sm" active={showGrid} onClick={() => setShowGrid((value) => !value)}>
              Grid
            </Button>
          </>
        )}
        <Button variant="status" size="sm" onClick={onTogglePresentationMode}>
          {presentationMode ? <Minimize2 className="ds-icon-sm" /> : <Maximize2 className="ds-icon-sm" />}
          {presentationMode ? 'Exit Presentation' : 'Presentation'}
        </Button>
      </div>

      {presentationMode ? null : (
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-engineering-border bg-engineering-panel/72 px-2 py-1 text-[11px] text-engineering-muted">
          <Ruler className="ds-icon-sm text-engineering-amber" />
          Construction Guides
        </div>
      )}

      {presentationMode ? null : (
        <div className="pointer-events-none absolute left-3 bottom-3 flex items-center gap-2 rounded-md border border-engineering-border bg-engineering-panel/72 px-2 py-1 text-[11px] text-engineering-muted">
          <Move className="ds-icon-sm text-engineering-teal" />
          Precision overlays stay subtle by default
        </div>
      )}
    </motion.section>
  );
};

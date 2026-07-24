import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Focus, Move, Ruler, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useRenderer } from '@/renderer/useRenderer';
import { nextZoomValue } from '@/renderer/services/zoomService';
import { createPanState, resolvePan, type PanState } from '@/renderer/services/panService';
import { useBandsStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';

export const CentreCanvas = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const bands = useBandsStore((s) => s.bands);
  const zoom = useViewportStore((s) => s.zoom);
  const panX = useViewportStore((s) => s.panX);
  const panY = useViewportStore((s) => s.panY);
  const showGuides = useViewportStore((s) => s.showGuides);
  const showSnapping = useViewportStore((s) => s.showSnapping);
  const scalePreview = useScaleStore((s) => s.preview);
  const setZoom = useViewportStore((s) => s.setZoom);
  const selectBand = useSelectionStore((s) => s.selectBand);
  const hoverBand = useSelectionStore((s) => s.hoverBand);
  const panBy = useViewportStore((s) => s.panBy);
  const resetPan = useViewportStore((s) => s.resetPan);
  const setMousePosition = useViewportStore((s) => s.setMousePosition);

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

  useEffect(() => {
    renderer.renderBands(bands, renderContext, { showGuides, showSnapping, scalePreview });
  }, [renderer, bands, renderContext, showGuides, showSnapping, scalePreview]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-full overflow-hidden rounded-panel border border-engineering-border bg-engineering-bg/80 shadow-panel"
    >
      <div
        ref={setContainer}
        className="h-full w-full cursor-crosshair overflow-hidden rounded-panel bg-grid bg-[size:36px_36px]"
        onWheel={(event) => {
          event.preventDefault();
          setZoom(nextZoomValue(zoom, event.deltaY));
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
          resetPan();
          setZoom(1);
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-engineering-amber/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-engineering-teal/25" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-engineering-teal/25" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-engineering-teal/25" />

      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-engineering-border bg-engineering-panel/90 px-2 py-1 font-mono text-xs text-engineering-muted">
        Wheel Zoom | Shift+Drag Pan | Double Click Reset
      </div>

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
        <Button variant="status" size="sm" onClick={() => setZoom(1)}>
          <Focus className="ds-icon-sm" /> Fit
        </Button>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-engineering-border bg-engineering-panel/90 px-2 py-1 text-[11px] text-engineering-muted">
        <Ruler className="ds-icon-sm text-engineering-amber" />
        Construction Guides
      </div>

      <div className="pointer-events-none absolute left-3 bottom-3 flex items-center gap-2 rounded-md border border-engineering-border bg-engineering-panel/90 px-2 py-1 text-[11px] text-engineering-muted">
        <Move className="ds-icon-sm text-engineering-teal" />
        Future snapping and alignment overlays
      </div>
    </motion.section>
  );
};

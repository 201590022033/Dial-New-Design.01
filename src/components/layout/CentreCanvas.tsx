import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useRenderer } from '@/renderer/useRenderer';
import { nextZoomValue } from '@/renderer/services/zoomService';
import { createPanState, resolvePan, type PanState } from '@/renderer/services/panService';
import { useBandsStore, useSelectionStore, useViewportStore } from '@/stores';

export const CentreCanvas = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const bands = useBandsStore((s) => s.bands);
  const zoom = useViewportStore((s) => s.zoom);
  const panX = useViewportStore((s) => s.panX);
  const panY = useViewportStore((s) => s.panY);
  const showGuides = useViewportStore((s) => s.showGuides);
  const showSnapping = useViewportStore((s) => s.showSnapping);
  const setZoom = useViewportStore((s) => s.setZoom);
  const selectBand = useSelectionStore((s) => s.selectBand);
  const hoverBand = useSelectionStore((s) => s.hoverBand);
  const panBy = useViewportStore((s) => s.panBy);
  const resetPan = useViewportStore((s) => s.resetPan);

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
    renderer.renderBands(bands, renderContext, { showGuides, showSnapping });
  }, [renderer, bands, renderContext, showGuides, showSnapping]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-full rounded-panel border border-engineering-border bg-engineering-bg/80 shadow-panel"
    >
      <div
        ref={setContainer}
        className="h-full w-full cursor-crosshair overflow-hidden rounded-panel bg-grid bg-[size:32px_32px]"
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
        }}
        onDoubleClick={() => {
          resetPan();
          setZoom(1);
        }}
      />
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-engineering-border bg-engineering-panel/90 px-2 py-1 font-mono text-xs text-engineering-muted">
        Wheel: Zoom • Shift+Drag: Pan • Double Click: Reset
      </div>
    </motion.section>
  );
};

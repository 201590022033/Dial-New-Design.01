import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Focus, Maximize2, Minimize2, Move, Ruler, ScanLine, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useRenderer } from '@/renderer/useRenderer';
import { nextZoomValue } from '@/renderer/services/zoomService';
import { createPanState, resolvePan, type PanState } from '@/renderer/services/panService';
import { resolveHighlightBandIds } from '@/features/shared/objectInspectorSchemas';
import { resolveSlideRuleReadout, screenPointToPolarSample } from '@/domain/scales/framework';
import type { ScaleEngineeringReadout } from '@/domain/scales/types';
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
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const scaleConfig = useScaleStore((s) => s.pluginConfig);
  const scaleContext = useScaleStore((s) => s.context);
  const engineeringReadout = useScaleStore((s) => s.engineeringReadout);
  const setEngineeringReadout = useScaleStore((s) => s.setEngineeringReadout);
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
  const wheelFrameRef = useRef<number | null>(null);
  const pendingWheelRef = useRef<{ zoom: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    lastPan.current = { x: panX, y: panY };
  }, [panX, panY]);

  useEffect(() => {
    return () => {
      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scalePreview) {
      setEngineeringReadout(null);
    }
  }, [scalePreview, setEngineeringReadout]);

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

  const previewFitScale = useMemo(() => {
    const maxOuterRadiusMm = bands.reduce((current, band) => Math.max(current, band.geometry.outerRadius), 20);
    const nominalDiameterPx = Math.max(1, mmToPixels(maxOuterRadiusMm * 2));
    const targetDiameterPx = Math.min(width, height) * 0.9;
    return Math.max(1, Math.min(2.6, targetDiameterPx / nominalDiameterPx));
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
        'relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-panel border border-engineering-border shadow-panel',
        presentationMode ? 'bg-[#edf0f4]' : 'bg-engineering-bg/85',
        presentationMode ? 'max-w-[1440px]' : 'max-w-[1360px]'
      ].join(' ')}
    >
      <div className="relative min-h-0 flex-1">
        <div
          ref={setContainer}
          className={[
            'h-full w-full cursor-crosshair overflow-hidden',
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

            pendingWheelRef.current = {
              zoom: nextZoom,
              panX: nextPanX,
              panY: nextPanY
            };

            if (wheelFrameRef.current !== null) {
              return;
            }

            wheelFrameRef.current = window.requestAnimationFrame(() => {
              const pending = pendingWheelRef.current;
              wheelFrameRef.current = null;
              if (!pending) {
                return;
              }

              useViewportStore.setState({
                zoom: pending.zoom,
                panX: pending.panX,
                panY: pending.panY
              });
              lastPan.current = { x: pending.panX, y: pending.panY };
              pendingWheelRef.current = null;
            });
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

            if (scalePreview) {
              const sample = screenPointToPolarSample({
                screenX: relativeX,
                screenY: relativeY,
                centerX: renderContext.centerX,
                centerY: renderContext.centerY,
                panX: renderContext.panX,
                panY: renderContext.panY,
                renderScale: renderContext.zoom * previewFitScale
              });

              const hasCollisionWarnings = scalePreview.validation.structuredWarnings.some(
                (warning) =>
                  warning.description.toLowerCase().includes('collision') ||
                  warning.description.toLowerCase().includes('overlap') ||
                  warning.affectedObject === 'layout-engine'
              );
              const hasManufacturingWarnings =
                scalePreview.validation.structuredWarnings.some(
                  (warning) => warning.affectedObject === 'manufacturing-engine'
                ) || (scalePreview.manufacturingMetadata?.ringDensityWarnings?.length ?? 0) > 0;

              const readout: ScaleEngineeringReadout | null =
                selectedScaleKind === 'slide-rule'
                  ? (() => {
                      const rawReadout = resolveSlideRuleReadout(
                        sample,
                        scaleConfig,
                        scaleContext,
                        scalePreview.ticks,
                        scalePreview.labels
                      );

                      if (!rawReadout) {
                        return null;
                      }

                      const collisionStatus: ScaleEngineeringReadout['collisionStatus'] = hasCollisionWarnings
                        ? 'warning'
                        : 'ok';
                      const manufacturingStatus: ScaleEngineeringReadout['manufacturingStatus'] =
                        hasManufacturingWarnings ? 'warning' : 'ok';

                      return {
                        ...rawReadout,
                        scaleKind: selectedScaleKind,
                        pluginName: scalePreview.pluginName,
                        collisionStatus,
                        manufacturingStatus,
                        engineeringScore:
                          scalePreview.validation.healthReport?.overallEngineeringScore ??
                          (hasCollisionWarnings || hasManufacturingWarnings ? 70 : 92)
                      };
                    })()
                  : (() => {
                      const nearestTick = scalePreview.ticks.reduce<typeof scalePreview.ticks[number] | null>(
                        (closest, tick) => {
                          if (!closest) {
                            return tick;
                          }

                          return Math.abs(tick.angleDeg - sample.angleDeg) <
                            Math.abs(closest.angleDeg - sample.angleDeg)
                            ? tick
                            : closest;
                        },
                        null
                      );

                      const nearestLabel = scalePreview.labels.reduce<typeof scalePreview.labels[number] | null>(
                        (closest, label) => {
                          if (!closest) {
                            return label;
                          }

                          return Math.abs(label.angleDeg - sample.angleDeg) <
                            Math.abs(closest.angleDeg - sample.angleDeg)
                            ? label
                            : closest;
                        },
                        null
                      );

                      const nearestValue = nearestTick?.value ?? scaleConfig.startValue;
                      const normalized =
                        scaleConfig.endValue === scaleConfig.startValue
                          ? 0
                          : (nearestValue - scaleConfig.startValue) /
                            (scaleConfig.endValue - scaleConfig.startValue);

                      const hasErrors = scalePreview.validation.structuredWarnings.some(
                        (warning) => warning.severity === 'error'
                      );
                      const collisionStatus: ScaleEngineeringReadout['collisionStatus'] = hasCollisionWarnings
                        ? 'warning'
                        : hasErrors
                          ? 'error'
                          : 'ok';
                      const manufacturingStatus: ScaleEngineeringReadout['manufacturingStatus'] =
                        hasManufacturingWarnings
                          ? 'warning'
                          : hasErrors
                            ? 'error'
                            : 'ok';

                      return {
                        ringId: 'outer' as const,
                        scaleKind: selectedScaleKind,
                        pluginName: scalePreview.pluginName,
                        value: nearestValue,
                        normalized,
                        angleDeg: sample.angleDeg,
                        radiusMm: sample.radiusMm,
                        nearestTick,
                        nearestLabel,
                        collisionStatus,
                        manufacturingStatus,
                        engineeringScore:
                          scalePreview.validation.healthReport?.overallEngineeringScore ??
                          (hasErrors ? 50 : 90)
                      };
                    })();

              setEngineeringReadout(readout);
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
            setEngineeringReadout(null);
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

        {presentationMode || !engineeringReadout ? null : (
          <div className="pointer-events-none absolute left-3 top-14 w-[280px] rounded-md border border-engineering-border bg-engineering-panel/84 px-2 py-2 text-[11px] text-engineering-muted shadow-panel">
            <p className="font-mono text-engineering-amber">Engineering Readout</p>
            <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 font-mono">
              <span>Scale</span>
              <span className="text-engineering-text">{engineeringReadout.scaleKind ?? selectedScaleKind}</span>
              <span>Plugin</span>
              <span className="text-engineering-text">{engineeringReadout.pluginName ?? scalePreview?.pluginName ?? '--'}</span>
              <span>Ring</span>
              <span className="text-engineering-text">{engineeringReadout.ringId}</span>
              <span>Value</span>
              <span className="text-engineering-text">{engineeringReadout.value.toFixed(6)}</span>
              <span>Normalized</span>
              <span className="text-engineering-text">{engineeringReadout.normalized.toFixed(6)}</span>
              <span>Angle</span>
              <span className="text-engineering-text">{engineeringReadout.angleDeg.toFixed(3)} deg</span>
              <span>Radius</span>
              <span className="text-engineering-text">{engineeringReadout.radiusMm.toFixed(3)} mm</span>
              <span>Tick</span>
              <span className="text-engineering-text">{engineeringReadout.nearestTick?.label ?? engineeringReadout.nearestTick?.tier ?? '--'}</span>
              <span>Label</span>
              <span className="text-engineering-text">{engineeringReadout.nearestLabel?.text ?? '--'}</span>
              <span>Collision</span>
              <span className="text-engineering-text">{engineeringReadout.collisionStatus ?? '--'}</span>
              <span>Manufacturing</span>
              <span className="text-engineering-text">{engineeringReadout.manufacturingStatus ?? '--'}</span>
              <span>Score</span>
              <span className="text-engineering-text">
                {engineeringReadout.engineeringScore ? engineeringReadout.engineeringScore.toFixed(2) : '--'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-engineering-border/70 bg-engineering-panel/75 px-3 py-2">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 overflow-x-auto">
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
      </div>
    </motion.section>
  );
};

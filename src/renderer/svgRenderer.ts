import { SVG, type Svg } from '@svgdotjs/svg.js';
import type { BandEntity } from '@/domain/bands/types';
import type { RenderContext, RendererAdapter, RendererOptions } from '@/renderer/types';
import { mmToPixels, polarToCartesian } from '@/utils/math';
import { renderGuides } from '@/renderer/services/guideService';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgRenderer implements RendererAdapter {
  private root: Svg | null = null;
  private container: HTMLElement | null = null;
  private latestBands: BandEntity[] = [];
  private latestContext: RenderContext | null = null;
  private latestFitScale = 1;

  mount(container: HTMLElement): void {
    this.container = container;
    this.root = SVG().addTo(container).size('100%', '100%');
    this.root.node.setAttribute('xmlns', SVG_NS);
  }

  unmount(): void {
    this.root?.clear();
    this.root?.remove();
    this.root = null;
    this.container = null;
  }

  renderBands(bands: BandEntity[], context: RenderContext, options: RendererOptions): void {
    if (!this.root) return;
    this.latestBands = bands;
    this.latestContext = context;

    this.root.clear();
    if (options.showGuides) {
      renderGuides(this.root, context.width, context.height);
    }

    const maxOuterRadiusMm = bands.reduce((current, band) => {
      return Math.max(current, band.geometry.outerRadius);
    }, 20);
    const nominalDiameterPx = Math.max(1, mmToPixels(maxOuterRadiusMm * 2));
    const targetDiameterPx = Math.min(context.width, context.height) * 0.82;
    const fitScale = Math.max(1, Math.min(2.4, targetDiameterPx / nominalDiameterPx));
    this.latestFitScale = fitScale;

    const layer = this.root.group().id('bands');
    layer.translate(context.panX, context.panY);
    layer.scale(context.zoom * fitScale);
    const highlightedBandIds = new Set(options.highlightedBandIds);
    const hasFocusSelection = highlightedBandIds.size > 0;

    if (options.designOverlay) {
      const overlay = options.designOverlay;
      const overlayLayer = layer.group().id('design-overlay');
      const dialRadiusPx = mmToPixels(14);
      const centreHoleRadiusPx = mmToPixels(overlay.dialFace.centreHoleMm / 2);

      const dialFace = overlayLayer
        .circle(dialRadiusPx * 2)
        .center(context.centerX, context.centerY)
        .fill({ color: overlay.dialFace.fill, opacity: overlay.dialFace.opacity })
        .stroke({
          color: overlay.dialFace.stroke,
          width: Math.max(1, mmToPixels(overlay.dialFace.borderWidthMm))
        });

      if (centreHoleRadiusPx > 0) {
        const dialMask = overlayLayer.mask();
        dialMask
          .rect(context.width * 2, context.height * 2)
          .move(-context.width / 2, -context.height / 2)
          .fill({ color: '#ffffff' });
        dialMask
          .circle(centreHoleRadiusPx * 2)
          .center(context.centerX, context.centerY)
          .fill({ color: '#000000' });
        dialFace.maskWith(dialMask);
      }

      overlay.markers.forEach((entry) => {
        const marker = entry.marker;
        const inner = polarToCartesian(mmToPixels(marker.innerRadiusMm), marker.angleDeg);
        const outer = polarToCartesian(mmToPixels(marker.outerRadiusMm), marker.angleDeg);
        const color = entry.lumed ? '#C7F9CC' : '#E2E8F0';

        if (entry.kind === 'round') {
          const dotRadiusPx = Math.max(1.5, mmToPixels(marker.widthMm));
          const midpoint = polarToCartesian(
            mmToPixels((marker.innerRadiusMm + marker.outerRadiusMm) / 2),
            marker.angleDeg
          );
          overlayLayer
            .circle(dotRadiusPx * 2)
            .center(context.centerX + midpoint.x, context.centerY + midpoint.y)
            .fill({ color, opacity: 0.95 })
            .stroke({ color: '#0F172A', width: 1 });
          return;
        }

        if (entry.kind === 'triangle') {
          const midpoint = polarToCartesian(
            mmToPixels((marker.innerRadiusMm + marker.outerRadiusMm) / 2),
            marker.angleDeg
          );
          const size = Math.max(2, mmToPixels(marker.widthMm * 2));
          overlayLayer
            .polygon(`0,-${size} ${size},${size} -${size},${size}`)
            .center(context.centerX + midpoint.x, context.centerY + midpoint.y)
            .rotate(marker.angleDeg + 90)
            .fill({ color, opacity: 0.95 })
            .stroke({ color: '#0F172A', width: 1 });
          return;
        }

        if (marker.text) {
          const textPoint = polarToCartesian(mmToPixels(marker.outerRadiusMm + 0.5), marker.angleDeg);
          overlayLayer
            .text(marker.text)
            .font({ size: 10, family: '"IBM Plex Mono", monospace', anchor: 'middle' })
            .fill(color)
            .center(context.centerX + textPoint.x, context.centerY + textPoint.y)
            .rotate(marker.angleDeg + 90, context.centerX + textPoint.x, context.centerY + textPoint.y);
          return;
        }

        overlayLayer
          .line(
            context.centerX + inner.x,
            context.centerY + inner.y,
            context.centerX + outer.x,
            context.centerY + outer.y
          )
          .stroke({ color, width: Math.max(1, mmToPixels(marker.widthMm)) });
      });

      overlay.typography.forEach((textEntry, index) => {
        const point = polarToCartesian(mmToPixels(textEntry.radiusMm), textEntry.angleDeg);
        overlayLayer
          .text(textEntry.text)
          .font({
            size: Math.max(8, mmToPixels(textEntry.fontSizeMm)),
            family: textEntry.fontFamily,
            anchor: 'middle'
          })
          .fill(textEntry.color)
          .center(context.centerX + point.x, context.centerY + point.y)
          .rotate(textEntry.rotationDeg + textEntry.angleDeg, context.centerX + point.x, context.centerY + point.y)
          .attr('data-typography-index', String(index));
      });

      overlay.chapterRingMarkers.forEach((marker, index) => {
        const inner = polarToCartesian(mmToPixels(marker.innerRadiusMm), marker.angleDeg);
        const outer = polarToCartesian(mmToPixels(marker.outerRadiusMm), marker.angleDeg);
        overlayLayer
          .line(
            context.centerX + inner.x,
            context.centerY + inner.y,
            context.centerX + outer.x,
            context.centerY + outer.y
          )
          .stroke({ color: '#F59E0B', width: Math.max(1, mmToPixels(marker.widthMm)) })
          .attr('data-chapter-marker-index', String(index));
      });
    }

    for (const band of [...bands].sort((a, b) => a.zIndex - b.zIndex)) {
      if (!band.visible) continue;
      const outerR = mmToPixels(band.geometry.outerRadius);
      const innerR = mmToPixels(band.geometry.innerRadius);
      const isHighlighted = highlightedBandIds.has(band.id);
      const fadedOpacity = hasFocusSelection && !isHighlighted ? Math.max(0.12, band.style.opacity * 0.42) : band.style.opacity;
      const strokeWidth = isHighlighted ? band.style.strokeWidth + 0.45 : band.style.strokeWidth;
      const strokeColor = isHighlighted ? '#E2E8F0' : band.style.stroke;

      const outer = layer.circle(outerR * 2).center(context.centerX, context.centerY);
      const inner = layer.circle(innerR * 2).center(context.centerX, context.centerY);
      const donut = outer
        .fill({ color: band.style.fill, opacity: fadedOpacity })
        .stroke({ color: strokeColor, width: strokeWidth });

      if (innerR > 0) {
        donut.maskWith(layer.mask().add(outer).add(inner.fill({ color: '#000000' })));
      }
      donut.attr('data-band-id', band.id);

      if (isHighlighted) {
        layer
          .circle(outerR * 2)
          .center(context.centerX, context.centerY)
          .fill({ opacity: 0 })
          .stroke({ color: '#E2E8F0', width: 0.6, opacity: 0.45 });
      }
    }

    if (options.scalePreview) {
      const overlay = layer.group().id('scale-preview');
      const { ticks, labels } = options.scalePreview;

      ticks.forEach((tick, index) => {
        const tickLength = mmToPixels(tick.lengthMm);
        const baseRadius = mmToPixels(tick.radiusMm);

        const directionMultiplier =
          tick.direction === 'inside' ? -1 : tick.direction === 'outside' ? 1 : 0;

        const startRadius =
          tick.direction === 'bidirectional'
            ? baseRadius - tickLength / 2
            : baseRadius;
        const endRadius =
          tick.direction === 'bidirectional'
            ? baseRadius + tickLength / 2
            : baseRadius + tickLength * directionMultiplier;

        const start = polarToCartesian(startRadius, tick.angleDeg);
        const end = polarToCartesian(endRadius, tick.angleDeg);

        overlay
          .line(
            context.centerX + start.x,
            context.centerY + start.y,
            context.centerX + end.x,
            context.centerY + end.y
          )
          .stroke({
            color: tick.weight === 'major' ? '#F59E0B' : '#94A3B8',
            width: Math.max(1, mmToPixels(tick.widthMm))
          })
          .attr('data-scale-tick-index', String(index));
      });

      labels.forEach((label, index) => {
        const point = polarToCartesian(mmToPixels(label.radiusMm), label.angleDeg);
        overlay
          .text(label.text)
          .font({ size: 10, family: '"IBM Plex Mono", monospace', anchor: 'middle' })
          .fill('#E2E8F0')
          .center(context.centerX + point.x, context.centerY + point.y)
          .rotate(
            label.orientation === 'horizontal' ? label.rotationDeg : label.angleDeg + label.rotationDeg,
            context.centerX + point.x,
            context.centerY + point.y
          )
          .attr('data-scale-label-index', String(index));
      });
    }
  }

  hitTest(screenX: number, screenY: number): string | null {
    if (!this.container || !this.latestContext) return null;
    const rect = this.container.getBoundingClientRect();
    const x = screenX - rect.left - this.latestContext.panX - this.latestContext.centerX;
    const y = screenY - rect.top - this.latestContext.panY - this.latestContext.centerY;
    const distPx = Math.sqrt(x * x + y * y) / (this.latestContext.zoom * this.latestFitScale);
    const distMm = distPx / 10;

    for (const band of [...this.latestBands].sort((a, b) => b.zIndex - a.zIndex)) {
      if (distMm >= band.geometry.innerRadius && distMm <= band.geometry.outerRadius) {
        return band.id;
      }
    }
    return null;
  }
}

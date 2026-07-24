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

    const layer = this.root.group().id('bands');
    layer.translate(context.panX, context.panY);
    layer.scale(context.zoom);

    for (const band of [...bands].sort((a, b) => a.zIndex - b.zIndex)) {
      if (!band.visible) continue;
      const outerR = mmToPixels(band.geometry.outerRadius);
      const innerR = mmToPixels(band.geometry.innerRadius);

      const outer = layer.circle(outerR * 2).center(context.centerX, context.centerY);
      const inner = layer.circle(innerR * 2).center(context.centerX, context.centerY);
      const donut = outer
        .fill({ color: band.style.fill, opacity: band.style.opacity })
        .stroke({ color: band.style.stroke, width: band.style.strokeWidth });

      if (innerR > 0) {
        donut.maskWith(layer.mask().add(outer).add(inner.fill({ color: '#000000' })));
      }
      donut.attr('data-band-id', band.id);
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
    const distPx = Math.sqrt(x * x + y * y) / this.latestContext.zoom;
    const distMm = distPx / 10;

    for (const band of [...this.latestBands].sort((a, b) => b.zIndex - a.zIndex)) {
      if (distMm >= band.geometry.innerRadius && distMm <= band.geometry.outerRadius) {
        return band.id;
      }
    }
    return null;
  }
}

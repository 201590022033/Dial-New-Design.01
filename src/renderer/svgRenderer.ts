import { SVG, type Svg } from '@svgdotjs/svg.js';
import { resolvePhysicalAssembly } from '@/domain/assembly/physicalAssembly';
import type { BandEntity } from '@/domain/bands/types';
import type {
  CanvasHitOptions,
  CanvasHitResult,
  RenderContext,
  RendererAdapter,
  RendererOptions
} from '@/renderer/types';
import { mmToPixels, polarToCartesian } from '@/utils/math';
import { renderGuides } from '@/renderer/services/guideService';
import { resolveCanvasHit } from '@/renderer/services/canvasHitResolver';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgRenderer implements RendererAdapter {
  private root: Svg | null = null;
  private container: HTMLElement | null = null;
  private latestContext: RenderContext | null = null;
  private latestAssembly: WatchAssembly | null = null;
  private latestFitScale = 1;
  private latestRenderKey = '';

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
    const assembly = options.assembly ?? useWatchAssemblyStore.getState().assembly;
    this.latestAssembly = assembly;

    const renderKey = JSON.stringify({
      bands: bands.map((band) => ({
        id: band.id,
        visible: band.visible,
        inner: band.geometry.innerRadius,
        outer: band.geometry.outerRadius,
        style: band.style,
        z: band.zIndex
      })),
      context,
      options: {
        showGuides: options.showGuides,
        showSnapping: options.showSnapping,
        highlightedBandIds: options.highlightedBandIds,
        scaleTickCount: options.scalePreview?.ticks.length ?? 0,
        scaleLabelCount: options.scalePreview?.labels.length ?? 0,
        designOverlay: options.designOverlay,
        selectedHitId: options.selectedHit?.partInstanceId ?? null,
        hoveredHitId: options.hoveredHit?.partInstanceId ?? null,
        crystalSelectionMode: options.crystalSelectionMode ?? false
      }
    });

    if (renderKey === this.latestRenderKey) {
      return;
    }

    this.latestRenderKey = renderKey;
    this.latestContext = context;

    this.root.clear();
    if (options.showGuides) {
      renderGuides(this.root, context.width, context.height);
    }

    const maxOuterRadiusMm = bands.reduce((current, band) => {
      return Math.max(current, band.geometry.outerRadius);
    }, 20);
    const nominalDiameterPx = Math.max(1, mmToPixels(maxOuterRadiusMm * 2));
    const targetDiameterPx = Math.min(context.width, context.height) * 0.9;
    const fitScale = Math.max(1, Math.min(2.6, targetDiameterPx / nominalDiameterPx));
    this.latestFitScale = fitScale;

    const layer = this.root.group().id('bands');
    layer.translate(context.panX, context.panY);
    layer.scale(context.zoom * fitScale);
    const highlightedBandIds = new Set(options.highlightedBandIds);
    const hasFocusSelection = highlightedBandIds.size > 0;
    const physicalAssembly = resolvePhysicalAssembly(bands);
    const dialFaceRegion = physicalAssembly.regions['dial-face'];
    const dateApertureX = context.centerX + mmToPixels(10.5);
    const dateApertureY = context.centerY;
    const dateWidthPx = mmToPixels(3.2);
    const dateHeightPx = mmToPixels(2.6);

    // 1. Render physical bands with semantic metadata attributes
    for (const band of [...bands].sort((a, b) => a.zIndex - b.zIndex)) {
      if (!band.visible) continue;
      const outerR = mmToPixels(band.geometry.outerRadius);
      const innerR = mmToPixels(band.geometry.innerRadius);
      const isHighlighted = highlightedBandIds.has(band.id);
      const fadedOpacity =
        hasFocusSelection && !isHighlighted
          ? Math.max(0.25, band.style.opacity * 0.72)
          : band.style.opacity;
      const strokeWidth = isHighlighted ? band.style.strokeWidth + 0.35 : band.style.strokeWidth;
      const strokeColor = isHighlighted ? '#E2E8F0' : band.style.stroke;

      // Group for semantic identification
      const bandGroup = layer.group().id(`band-group-${band.id}`);

      // Map band to semantic metadata
      let partInstanceId = band.id;
      let catalogueItemId = band.id;
      let partCategory = 'rings';
      let interactionRole = 'physical-part';
      let subElementId: string = band.kind;
      let subElementKind: string = band.kind;
      let zLayer = band.zIndex * 10;
      let label = band.name;

      if (band.id === 'band-outer-bezel') {
        partInstanceId = 'inst-rotating-bezel';
        catalogueItemId = 'cat-rotating-bezel';
        partCategory = 'rings';
        interactionRole = 'physical-part';
        subElementId = 'bezel-body';
        subElementKind = 'bezel';
        zLayer = 150;
        label = 'Rotating Bezel';
      } else if (band.id === 'band-inner-bezel') {
        partInstanceId = 'inst-inner-bezel';
        catalogueItemId = 'cat-inner-bezel';
        partCategory = 'rings';
        interactionRole = 'content-group';
        subElementId = 'bezel-scale';
        subElementKind = 'scale';
        zLayer = 200;
        label = 'Bezel Insert / Scale';
      } else if (band.id === 'band-chapter-ring') {
        partInstanceId = 'inst-chapter-ring';
        catalogueItemId = 'cat-chapter-ring';
        partCategory = 'rings';
        interactionRole = 'physical-part';
        subElementId = 'chapter-ring-body';
        subElementKind = 'ring';
        zLayer = 250;
        label = 'Chapter Ring';
      } else if (band.id === 'band-dial-face') {
        partInstanceId = 'inst-dial-blank';
        catalogueItemId = 'cat-dial-blank';
        partCategory = 'dial';
        interactionRole = 'physical-part';
        subElementId = 'dial-surface';
        subElementKind = 'surface';
        zLayer = 300;
        label = 'Dial Face';
      }

      bandGroup
        .attr('data-part-instance-id', partInstanceId)
        .attr('data-catalogue-item-id', catalogueItemId)
        .attr('data-part-category', partCategory)
        .attr('data-interaction-role', interactionRole)
        .attr('data-sub-element-id', subElementId)
        .attr('data-sub-element-kind', subElementKind)
        .attr('data-z-layer', String(zLayer))
        .attr('data-band-id', band.id)
        .attr('data-label', label);

      const outer = bandGroup.circle(outerR * 2).center(context.centerX, context.centerY);
      const inner = bandGroup.circle(innerR * 2).center(context.centerX, context.centerY);
      const donut = outer
        .fill({ color: band.style.fill, opacity: fadedOpacity })
        .stroke({ color: strokeColor, width: strokeWidth })
        .attr('data-interaction-role', 'rendering-primitive');

      if (innerR > 0) {
        donut.maskWith(layer.mask().add(outer).add(inner.fill({ color: '#000000' })));
      }
      donut.attr('data-band-id', band.id);

      if (isHighlighted) {
        bandGroup
          .circle(outerR * 2)
          .center(context.centerX, context.centerY)
          .fill({ opacity: 0 })
          .stroke({ color: '#E2E8F0', width: 0.6, opacity: 0.45 })
          .attr('data-interaction-role', 'rendering-primitive');
      }
    }

    // 2. Dial face design overlay (surface, applied markers, typography, chapter track)
    if (options.designOverlay) {
      const overlay = options.designOverlay;
      const overlayLayer = layer.group().id('design-overlay');
      const dialRadiusMm = dialFaceRegion?.outerRadiusMm ?? 14.25;
      const dialRadiusPx = mmToPixels(dialRadiusMm);
      const centreHoleRadiusPx = mmToPixels(overlay.dialFace.centreHoleMm / 2);

      // Dial Surface Group
      const dialSurfaceGroup = overlayLayer
        .group()
        .id('part-dial-surface')
        .attr('data-part-instance-id', 'inst-dial-blank')
        .attr('data-catalogue-item-id', 'cat-dial-blank')
        .attr('data-part-category', 'dial')
        .attr('data-interaction-role', 'physical-part')
        .attr('data-sub-element-id', 'dial-surface')
        .attr('data-sub-element-kind', 'surface')
        .attr('data-z-layer', '300')
        .attr('data-band-id', 'band-dial-face')
        .attr('data-label', 'Dial Face');

      const dialFace = dialSurfaceGroup
        .circle(dialRadiusPx * 2)
        .center(context.centerX, context.centerY)
        .fill({ color: overlay.dialFace.fill, opacity: overlay.dialFace.opacity })
        .stroke({
          color: overlay.dialFace.stroke,
          width: Math.max(1, mmToPixels(overlay.dialFace.borderWidthMm))
        })
        .attr('data-interaction-role', 'rendering-primitive');

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

      // Date Window complication aperture (rendered on dial at 3 o'clock)
      const dateWindowGroup = overlayLayer
        .group()
        .id('part-date-window')
        .attr('data-part-instance-id', 'inst-date-window')
        .attr('data-catalogue-item-id', 'cat-date-window')
        .attr('data-part-category', 'complications')
        .attr('data-interaction-role', 'design-element')
        .attr('data-sub-element-id', 'date-window')
        .attr('data-sub-element-kind', 'aperture')
        .attr('data-z-layer', '500')
        .attr('data-band-id', 'band-dial-face')
        .attr('data-label', 'Date Window');

      // Frame
      dateWindowGroup
        .rect(dateWidthPx + 2, dateHeightPx + 2)
        .center(dateApertureX, dateApertureY)
        .fill({ color: '#0F172A' })
        .stroke({ color: '#CBD5E1', width: 1 })
        .radius(1.5)
        .attr('data-interaction-role', 'rendering-primitive');

      // Date Disc background
      dateWindowGroup
        .rect(dateWidthPx, dateHeightPx)
        .center(dateApertureX, dateApertureY)
        .fill({ color: '#F8FAFC' })
        .radius(1)
        .attr('data-interaction-role', 'rendering-primitive');

      // Date numeral
      dateWindowGroup
        .text('18')
        .font({ size: 9, family: '"IBM Plex Mono", monospace', anchor: 'middle', weight: 'bold' })
        .fill('#0F172A')
        .center(dateApertureX, dateApertureY)
        .attr('data-interaction-role', 'rendering-primitive');

      // Applied indices / Hour marker group
      const markersGroup = overlayLayer
        .group()
        .id('group-hour-markers')
        .attr('data-part-instance-id', 'inst-applied-indices')
        .attr('data-catalogue-item-id', 'cat-applied-indices')
        .attr('data-part-category', 'indices')
        .attr('data-interaction-role', 'content-group')
        .attr('data-sub-element-id', 'hour-marker-set')
        .attr('data-sub-element-kind', 'indices')
        .attr('data-z-layer', '400')
        .attr('data-band-id', 'band-dial-face')
        .attr('data-label', 'Hour Markers');

      overlay.markers.forEach((entry, index) => {
        const marker = entry.marker;
        const markerLengthMm = Math.max(0, marker.outerRadiusMm - marker.innerRadiusMm);
        const outerRadiusMm = Math.min(marker.outerRadiusMm, dialRadiusMm);
        const innerRadiusMm = Math.max(0, outerRadiusMm - markerLengthMm);
        const inner = polarToCartesian(mmToPixels(innerRadiusMm), marker.angleDeg);
        const outer = polarToCartesian(mmToPixels(outerRadiusMm), marker.angleDeg);
        const color = entry.lumed ? '#C7F9CC' : '#E2E8F0';

        if (entry.kind === 'round') {
          const dotRadiusPx = Math.max(1.5, mmToPixels(marker.widthMm));
          const midpoint = polarToCartesian(
            mmToPixels((innerRadiusMm + outerRadiusMm) / 2),
            marker.angleDeg
          );
          markersGroup
            .circle(dotRadiusPx * 2)
            .center(context.centerX + midpoint.x, context.centerY + midpoint.y)
            .fill({ color, opacity: 0.95 })
            .stroke({ color: '#334155', width: 0.8 })
            .attr('data-marker-index', String(index))
            .attr('data-interaction-role', 'rendering-primitive');
        } else {
          markersGroup
            .line(
              context.centerX + inner.x,
              context.centerY + inner.y,
              context.centerX + outer.x,
              context.centerY + outer.y
            )
            .stroke({ color, width: Math.max(1, mmToPixels(marker.widthMm)) })
            .attr('data-marker-index', String(index))
            .attr('data-interaction-role', 'rendering-primitive');
        }
      });

      // Dial Typography group
      const typographyGroup = overlayLayer
        .group()
        .id('group-dial-typography')
        .attr('data-part-instance-id', 'inst-brand-text')
        .attr('data-catalogue-item-id', 'cat-brand-text')
        .attr('data-part-category', 'typography')
        .attr('data-interaction-role', 'content-group')
        .attr('data-sub-element-id', 'brand-typography')
        .attr('data-sub-element-kind', 'typography')
        .attr('data-z-layer', '450')
        .attr('data-band-id', 'band-dial-face')
        .attr('data-label', 'Dial Typography');

      overlay.typography.forEach((item, index) => {
        const point = polarToCartesian(mmToPixels(item.radiusMm), item.angleDeg);
        typographyGroup
          .text(item.text)
          .font({
            size: Math.max(8, mmToPixels(item.fontSizeMm)),
            family: item.fontFamily,
            anchor: 'middle'
          })
          .fill(item.color)
          .center(context.centerX + point.x, context.centerY + point.y)
          .rotate(
            item.orientation === 'horizontal' ? item.rotationDeg : item.angleDeg + item.rotationDeg,
            context.centerX + point.x,
            context.centerY + point.y
          )
          .attr('data-typography-index', String(index))
          .attr('data-interaction-role', 'rendering-primitive');
      });

      // Chapter Ring Typography & Minute Scale group
      const chapterGroup = overlayLayer
        .group()
        .id('group-chapter-minute-scale')
        .attr('data-part-instance-id', 'inst-chapter-ring')
        .attr('data-catalogue-item-id', 'cat-chapter-ring')
        .attr('data-part-category', 'rings')
        .attr('data-interaction-role', 'content-group')
        .attr('data-sub-element-id', 'chapter-minute-scale')
        .attr('data-sub-element-kind', 'scale')
        .attr('data-z-layer', '255')
        .attr('data-band-id', 'band-chapter-ring')
        .attr('data-label', 'Chapter Minute Scale');

      overlay.chapterRingTypography.forEach((item, index) => {
        const point = polarToCartesian(mmToPixels(item.radiusMm), item.angleDeg);
        chapterGroup
          .text(item.text)
          .font({
            size: Math.max(8, mmToPixels(item.fontSizeMm)),
            family: item.fontFamily,
            anchor: 'middle'
          })
          .fill(item.color)
          .center(context.centerX + point.x, context.centerY + point.y)
          .rotate(
            item.orientation === 'horizontal' ? item.rotationDeg : item.angleDeg + item.rotationDeg,
            context.centerX + point.x,
            context.centerY + point.y
          )
          .attr('data-chapter-text-index', String(index))
          .attr('data-interaction-role', 'rendering-primitive');
      });

      overlay.chapterRingMarkers.forEach((marker, index) => {
        const inner = polarToCartesian(mmToPixels(marker.innerRadiusMm), marker.angleDeg);
        const outer = polarToCartesian(mmToPixels(marker.outerRadiusMm), marker.angleDeg);
        chapterGroup
          .line(
            context.centerX + inner.x,
            context.centerY + inner.y,
            context.centerX + outer.x,
            context.centerY + outer.y
          )
          .stroke({ color: '#F59E0B', width: Math.max(1, mmToPixels(marker.widthMm)) })
          .attr('data-chapter-marker-index', String(index))
          .attr('data-interaction-role', 'rendering-primitive');
      });
    }

    layer.findOne('#design-overlay')?.front();

    // 3. Procedural Scale Preview (e.g. Slide Rule or Dive Scale)
    if (options.scalePreview) {
      const scaleGroup = layer
        .group()
        .id('scale-preview')
        .attr('data-part-instance-id', 'inst-inner-bezel')
        .attr('data-catalogue-item-id', 'cat-inner-bezel')
        .attr('data-part-category', 'rings')
        .attr('data-interaction-role', 'content-group')
        .attr('data-sub-element-id', 'bezel-scale')
        .attr('data-sub-element-kind', 'scale')
        .attr('data-z-layer', '210')
        .attr('data-band-id', 'band-inner-bezel')
        .attr('data-label', 'Bezel Scale');

      const { ticks, labels } = options.scalePreview;
      const maxPreviewRadiusPx = Math.min(context.width, context.height) * 0.62;

      ticks.forEach((tick, index) => {
        const tickLength = mmToPixels(tick.lengthMm);
        const baseRadius = mmToPixels(tick.radiusMm);
        if (baseRadius > maxPreviewRadiusPx) {
          return;
        }

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

        scaleGroup
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
          .attr('data-scale-tick-index', String(index))
          .attr('data-interaction-role', 'rendering-primitive');
      });

      labels.forEach((label, index) => {
        if (mmToPixels(label.radiusMm) > maxPreviewRadiusPx) {
          return;
        }
        const point = polarToCartesian(mmToPixels(label.radiusMm), label.angleDeg);
        scaleGroup
          .text(label.text)
          .font({ size: 10, family: '"IBM Plex Mono", monospace', anchor: 'middle' })
          .fill('#E2E8F0')
          .center(context.centerX + point.x, context.centerY + point.y)
          .rotate(
            label.orientation === 'horizontal' ? label.rotationDeg : label.angleDeg + label.rotationDeg,
            context.centerX + point.x,
            context.centerY + point.y
          )
          .attr('data-scale-label-index', String(index))
          .attr('data-interaction-role', 'rendering-primitive');
      });
    }

    // 4. Render Physical Hands Stack (Hour, Minute, Seconds) at canonical 10:10 presentation time
    const handsLayer = layer
      .group()
      .id('group-watch-hands')
      .attr('data-part-category', 'hands')
      .attr('data-interaction-role', 'physical-part')
      .attr('data-z-layer', '700');

    // Hour Hand: 10:10 presentation angle ~ 305° (10 o'clock)
    const hourAngleDeg = 305;
    const hourHandLengthPx = mmToPixels(10.2);
    const hourHandTip = polarToCartesian(hourHandLengthPx, hourAngleDeg);
    const hourGroup = handsLayer
      .group()
      .id('part-hour-hand')
      .attr('data-part-instance-id', 'inst-hour-hand')
      .attr('data-catalogue-item-id', 'cat-hour-hand')
      .attr('data-part-category', 'hands')
      .attr('data-interaction-role', 'physical-part')
      .attr('data-sub-element-id', 'hour-hand')
      .attr('data-sub-element-kind', 'hand')
      .attr('data-z-layer', '700')
      .attr('data-band-id', 'band-hands')
      .attr('data-label', 'Hour Hand');

    // Hour hand sword blade
    hourGroup
      .line(
        context.centerX,
        context.centerY,
        context.centerX + hourHandTip.x,
        context.centerY + hourHandTip.y
      )
      .stroke({ color: '#F1F5F9', width: 3.2, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // Hour hand lumen inlay
    const hourLumenStart = polarToCartesian(mmToPixels(3.5), hourAngleDeg);
    const hourLumenEnd = polarToCartesian(hourHandLengthPx - 3, hourAngleDeg);
    hourGroup
      .line(
        context.centerX + hourLumenStart.x,
        context.centerY + hourLumenStart.y,
        context.centerX + hourLumenEnd.x,
        context.centerY + hourLumenEnd.y
      )
      .stroke({ color: '#A7F3D0', width: 1.6, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // Minute Hand: 10:10 presentation angle ~ 60° (2 o'clock)
    const minuteAngleDeg = 60;
    const minuteHandLengthPx = mmToPixels(13.6);
    const minuteHandTip = polarToCartesian(minuteHandLengthPx, minuteAngleDeg);
    const minuteGroup = handsLayer
      .group()
      .id('part-minute-hand')
      .attr('data-part-instance-id', 'inst-minute-hand')
      .attr('data-catalogue-item-id', 'cat-minute-hand')
      .attr('data-part-category', 'hands')
      .attr('data-interaction-role', 'physical-part')
      .attr('data-sub-element-id', 'minute-hand')
      .attr('data-sub-element-kind', 'hand')
      .attr('data-z-layer', '710')
      .attr('data-band-id', 'band-hands')
      .attr('data-label', 'Minute Hand');

    // Minute hand blade
    minuteGroup
      .line(
        context.centerX,
        context.centerY,
        context.centerX + minuteHandTip.x,
        context.centerY + minuteHandTip.y
      )
      .stroke({ color: '#E2E8F0', width: 2.4, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // Minute hand lumen inlay
    const minuteLumenStart = polarToCartesian(mmToPixels(4.0), minuteAngleDeg);
    const minuteLumenEnd = polarToCartesian(minuteHandLengthPx - 3, minuteAngleDeg);
    minuteGroup
      .line(
        context.centerX + minuteLumenStart.x,
        context.centerY + minuteLumenStart.y,
        context.centerX + minuteLumenEnd.x,
        context.centerY + minuteLumenEnd.y
      )
      .stroke({ color: '#A7F3D0', width: 1.2, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // Central Seconds Hand: angle ~ 210°, needle tip with accent color and counterweight disc
    const secondAngleDeg = 210;
    const secondHandLengthPx = mmToPixels(14.2);
    const secondHandTip = polarToCartesian(secondHandLengthPx, secondAngleDeg);
    const secondTailTip = polarToCartesian(mmToPixels(3.5), secondAngleDeg + 180);

    const secondGroup = handsLayer
      .group()
      .id('part-central-seconds')
      .attr('data-part-instance-id', 'inst-central-seconds')
      .attr('data-catalogue-item-id', 'cat-central-seconds')
      .attr('data-part-category', 'hands')
      .attr('data-interaction-role', 'physical-part')
      .attr('data-sub-element-id', 'central-seconds')
      .attr('data-sub-element-kind', 'hand')
      .attr('data-z-layer', '720')
      .attr('data-band-id', 'band-hands')
      .attr('data-label', 'Central Seconds');

    secondGroup
      .line(
        context.centerX + secondTailTip.x,
        context.centerY + secondTailTip.y,
        context.centerX + secondHandTip.x,
        context.centerY + secondHandTip.y
      )
      .stroke({ color: '#EF4444', width: 1.0, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // Center Collet & Pin Cap
    handsLayer
      .circle(5)
      .center(context.centerX, context.centerY)
      .fill({ color: '#475569' })
      .stroke({ color: '#CBD5E1', width: 1 })
      .attr('data-interaction-role', 'rendering-primitive');

    // 5. Crystal layer: transparent overlay by default (pointer-events: none), selectable in crystal mode
    const crystalSelectionMode = Boolean(options.crystalSelectionMode);
    const crystalRadiusPx = mmToPixels(assembly.globalDimensions.caseDiameterMm / 2 - 1.5);
    const crystalGroup = layer
      .group()
      .id('part-crystal')
      .attr('data-part-instance-id', 'inst-crystal')
      .attr('data-catalogue-item-id', 'cat-crystal')
      .attr('data-part-category', 'crystal')
      .attr('data-interaction-role', crystalSelectionMode ? 'physical-part' : 'transparent-overlay')
      .attr('data-sub-element-id', 'crystal-glass')
      .attr('data-sub-element-kind', 'crystal')
      .attr('data-z-layer', '800')
      .attr('data-label', 'Crystal')
      .css('pointer-events', crystalSelectionMode ? 'auto' : 'none');

    // Specular sapphire curved reflection arc
    const glareStart = polarToCartesian(crystalRadiusPx * 0.88, 220);
    const glareEnd = polarToCartesian(crystalRadiusPx * 0.88, 320);
    crystalGroup
      .path(
        `M ${context.centerX + glareStart.x} ${context.centerY + glareStart.y} A ${crystalRadiusPx * 0.88} ${crystalRadiusPx * 0.88} 0 0 1 ${context.centerX + glareEnd.x} ${context.centerY + glareEnd.y}`
      )
      .fill('none')
      .stroke({ color: '#BAE6FD', width: 1.8, opacity: 0.35, linecap: 'round' })
      .attr('data-interaction-role', 'rendering-primitive');

    // 6. Preview-only Non-Destructive Selection & Hover Highlight Overlays
    const highlightGroup = layer.group().id('interaction-highlights').css('pointer-events', 'none');

    // Render hovered highlight if not already selected
    if (
      options.hoveredHit &&
      options.hoveredHit.partInstanceId !== options.selectedHit?.partInstanceId
    ) {
      const hit = options.hoveredHit;
      if (hit.category === 'hands') {
        const angle =
          hit.subElementId === 'hour-hand' ? 305 : hit.subElementId === 'minute-hand' ? 60 : 210;
        const len =
          hit.subElementId === 'hour-hand'
            ? mmToPixels(10.5)
            : hit.subElementId === 'minute-hand'
              ? mmToPixels(13.8)
              : mmToPixels(14.5);
        const tip = polarToCartesian(len, angle);
        highlightGroup
          .line(context.centerX, context.centerY, context.centerX + tip.x, context.centerY + tip.y)
          .stroke({ color: '#F59E0B', width: 4.5, opacity: 0.55, linecap: 'round' });
      } else if (hit.category === 'complications') {
        highlightGroup
          .rect(dateWidthPx + 6, dateHeightPx + 6)
          .center(dateApertureX, dateApertureY)
          .fill('none')
          .stroke({ color: '#F59E0B', width: 1.8, opacity: 0.75 })
          .radius(2.5);
      } else if (hit.category === 'indices') {
        highlightGroup
          .circle(mmToPixels(dialFaceRegion?.outerRadiusMm ?? 14) * 1.85)
          .center(context.centerX, context.centerY)
          .fill('none')
          .stroke({ color: '#F59E0B', width: 1.5, opacity: 0.65, dasharray: '4 4' });
      } else if (hit.bandId && bands.find((b) => b.id === hit.bandId)) {
        const b = bands.find((band) => band.id === hit.bandId)!;
        highlightGroup
          .circle(mmToPixels(b.geometry.outerRadius) * 2)
          .center(context.centerX, context.centerY)
          .fill('none')
          .stroke({ color: '#F59E0B', width: 1.8, opacity: 0.65, dasharray: '3 3' });
      }
    }

    // Render persistent selected highlight
    if (options.selectedHit) {
      const hit = options.selectedHit;
      if (hit.category === 'hands') {
        const angle =
          hit.subElementId === 'hour-hand' ? 305 : hit.subElementId === 'minute-hand' ? 60 : 210;
        const len =
          hit.subElementId === 'hour-hand'
            ? mmToPixels(10.5)
            : hit.subElementId === 'minute-hand'
              ? mmToPixels(13.8)
              : mmToPixels(14.5);
        const tip = polarToCartesian(len, angle);
        highlightGroup
          .line(context.centerX, context.centerY, context.centerX + tip.x, context.centerY + tip.y)
          .stroke({ color: '#38BDF8', width: 5.5, opacity: 0.85, linecap: 'round' });
      } else if (hit.category === 'complications') {
        highlightGroup
          .rect(dateWidthPx + 8, dateHeightPx + 8)
          .center(dateApertureX, dateApertureY)
          .fill('none')
          .stroke({ color: '#38BDF8', width: 2.2, opacity: 0.95 })
          .radius(3);
      } else if (hit.category === 'indices') {
        highlightGroup
          .circle(mmToPixels(dialFaceRegion?.outerRadiusMm ?? 14) * 1.85)
          .center(context.centerX, context.centerY)
          .fill('none')
          .stroke({ color: '#38BDF8', width: 2.2, opacity: 0.85 });
      } else if (hit.partInstanceId === 'inst-crystal') {
        highlightGroup
          .circle(crystalRadiusPx * 2)
          .center(context.centerX, context.centerY)
          .fill('none')
          .stroke({ color: '#38BDF8', width: 2.5, opacity: 0.85 });
      } else if (hit.bandId && bands.find((b) => b.id === hit.bandId)) {
        const b = bands.find((band) => band.id === hit.bandId)!;
        highlightGroup
          .circle(mmToPixels(b.geometry.outerRadius) * 2)
          .center(context.centerX, context.centerY)
          .fill('none')
          .stroke({ color: '#38BDF8', width: 2.5, opacity: 0.9 });
      }
    }
  }

  /**
   * Phase 4 semantic hit testing: delegates to layered resolver with DOM inspection and 2.5D geometry fallback.
   */
  hitTestSemantic(
    screenX: number,
    screenY: number,
    options?: CanvasHitOptions
  ): CanvasHitResult | null {
    if (!this.container || !this.latestContext) return null;
    const assembly = this.latestAssembly ?? useWatchAssemblyStore.getState().assembly;
    return resolveCanvasHit(
      this.container,
      screenX,
      screenY,
      assembly,
      {
        centerX: this.latestContext.centerX,
        centerY: this.latestContext.centerY,
        panX: this.latestContext.panX,
        panY: this.latestContext.panY,
        zoom: this.latestContext.zoom,
        fitScale: this.latestFitScale
      },
      options
    );
  }

  /**
   * Backward-compatible hit test returning bandId or partInstanceId.
   */
  hitTest(screenX: number, screenY: number): string | null {
    const hit = this.hitTestSemantic(screenX, screenY);
    if (!hit) return null;
    return hit.bandId ?? hit.partInstanceId ?? null;
  }
}
